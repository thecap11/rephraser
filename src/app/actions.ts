
"use server";

import { revalidatePath } from "next/cache";
import mammoth from "mammoth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  Header,
  PageBorderOffsetFrom,
  PageBorders,
  BorderStyle,
} from "docx";
import fs from "fs/promises";
import path from "path";
import { generateRephrasedDocument } from "@/ai/flows/generate-rephrased-document";
import { z } from "zod";

const fullFormSchema = z.object({
  fullName: z.string(),
  rollNumber: z.string(),
  classAndSection: z.string(),
  studyLevel: z.string(),
  yearAndTerm: z.string(),
  subjectName: z.string(),
  assessmentName: z.string(),
  submissionDate: z.string().transform((str) => new Date(str)),
  creativity: z.string().transform(parseFloat),
  humanize: z.string().transform((str) => str === 'true'),
  document: z.any(),
});

// Helper to sanitize filename
const sanitizeFilename = (name: string) => name.replace(/[^a-zA-Z0-9_]/g, "_");

// Helper to create paragraphs with optional bullet points
const createFormattedParagraphs = (text: string): Paragraph[] => {
  if (!text) return [new Paragraph("")];
  const lines = text.split('\n');
  
  return lines.map(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('*')) {
      return new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine.substring(1).trim(), // Remove asterisk and trim
            font: "Times New Roman",
            size: 24, // 12pt
          })
        ],
        style: "Normal",
        bullet: {
          level: 0
        }
      });
    }
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: "Times New Roman",
          size: 24, // 12pt
        })
      ],
      style: "Normal"
    });
  });
};


export async function generateDocument(
  formData: FormData
): Promise<{ filename?: string; content?: string; error?: string }> {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const parsedData = fullFormSchema.safeParse(rawData);

    if (!parsedData.success) {
      const errorMessages = parsedData.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ');
      return { error: `Invalid form data: ${errorMessages}` };
    }

    const data = parsedData.data;
    const docFile = formData.get("document") as File;

    if (!docFile || docFile.size === 0) {
      return { error: "Document is required." };
    }

    const buffer = Buffer.from(await docFile.arrayBuffer());
    const textExtractionResult = await mammoth.extractRawText({ buffer });
    let originalText = textExtractionResult.value;

     if (!originalText.trim()) {
      return {
        error: "Could not extract any text from the document. Please ensure it's not empty or corrupted.",
      };
    }

    const rephrasedResult = await generateRephrasedDocument({
      documentText: originalText,
      creativityLevel: data.creativity,
      humanize: data.humanize,
    });
    
    if (!rephrasedResult || !rephrasedResult.rephrasedContent) {
        throw new Error("AI rephrasing failed to return structured content.");
    }
    const content = rephrasedResult.rephrasedContent;
    
    const studentInfoCellPadding = {
      top: 72, // 0.05 inch
      bottom: 72,
      left: 72,
      right: 72,
    };
    
    const contentCellPadding = {
      top: 144, // 0.1 inch
      bottom: 144,
      left: 144,
      right: 144,
    };

    const createStudentInfoLabelCell = (text: string) => {
      return new TableCell({
        children: [new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              font: "Times New Roman",
              size: 24, // 12pt
            })
          ],
          style: "Normal"
        })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        margins: studentInfoCellPadding
      });
    }
    
    const createStudentInfoValueCell = (text: string) => {
      return new TableCell({
        children: [new Paragraph({
          children: [
             new TextRun({
              text,
              font: "Times New Roman",
              size: 24 // 12pt
            })
          ],
          style: "Normal"
        })],
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: studentInfoCellPadding
      });
    }
    
    const createContentLabelCell = (text: string) => {
      return new TableCell({
        children: [new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              font: "Times New Roman",
              size: 24, // 12pt
              color: "FF0000",
            })
          ],
          style: "Normal"
        })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        margins: contentCellPadding
      });
    }

    const createContentValueCell = (text: string) => {
      return new TableCell({
        children: [new Paragraph({
          children: [
             new TextRun({
              text,
              font: "Times New Roman",
              size: 24 // 12pt
            })
          ],
          style: "Normal"
        })],
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: contentCellPadding
      });
    }

    const createComplexContentCell = (text: string) => {
        return new TableCell({
            children: createFormattedParagraphs(text),
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: contentCellPadding,
        });
    };
    
    const createBulletListCell = (items: string[]) => {
      return new TableCell({
        children: items.map(item => new Paragraph({
          children: [
            new TextRun({
              text: item,
              font: "Times New Roman",
              size: 24 // 12pt
            })
          ],
          style: "Normal",
          bullet: {
            level: 0
          }
        })),
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: contentCellPadding
      });
    }

    const imagePath = path.join(process.cwd(), "public", "templates", "aurora_header.png");
    const imageBuffer = await fs.readFile(imagePath);

    const doc = new Document({
        creator: "Journal Reframer",
        title: data.assessmentName,
        description: `Reflective journal for ${data.subjectName}`,
        styles: {
          paragraphStyles: [
            {
              id: "Normal",
              name: "Normal",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Times New Roman",
                size: 24, // 12pt
              },
              paragraph: {
                spacing: { line: 276, after: 120 }, // 1.15 line spacing, 6pt after (120/20)
                alignment: AlignmentType.JUSTIFIED,
              },
            },
          ],
        },
        sections: [{
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageBuffer,
                                    transformation: {
                                        width: 792, 
                                        height: 60,
                                    },
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            },
            properties: {
                page: {
                    margin: {
                        top: 1440, // 1 inch
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                    borders: {
                        pageBorders: {
                            offsetFrom: PageBorderOffsetFrom.PAGE,
                            borderTop: { style: BorderStyle.SINGLE, size: 12, color: "000000" }, // 1.5pt * 8
                            borderRight: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                            borderBottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                            borderLeft: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
                        }
                    }
                },
            },
            children: [
                 new Paragraph({
                    children: [
                        new TextRun({
                        text: "Reflective Journal",
                        bold: true,
                        size: 28, // 14pt
                        font: "Times New Roman",
                        color: "FF0000",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240, before: 720 },
                }),
                 new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [ createStudentInfoLabelCell("Student Name"), createStudentInfoValueCell(data.fullName) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Student Registration Number"), createStudentInfoValueCell(data.rollNumber) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Class & Section"), createStudentInfoValueCell(data.classAndSection) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Study Level"), createStudentInfoValueCell(data.studyLevel) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Year & Term"), createStudentInfoValueCell(data.yearAndTerm) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Subject Name"), createStudentInfoValueCell(data.subjectName) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Name of Assessment"), createStudentInfoValueCell(data.assessmentName) ] }),
                        new TableRow({ children: [ createStudentInfoLabelCell("Date of Submission"), createStudentInfoValueCell(data.submissionDate.toLocaleDateString('en-CA')) ] }),
                    ],
                }),
                new Paragraph({ spacing: { before: 480 } }), // Spacer
                 new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [ createContentLabelCell("Topic"), createContentValueCell(content.topic) ] }),
                        new TableRow({ children: [ createContentLabelCell("Experience"), createContentValueCell(content.experience) ] }),
                        new TableRow({ children: [ createContentLabelCell("Feelings"), createContentValueCell(content.feelings) ] }),
                        new TableRow({ children: [ createContentLabelCell("Learning"), createComplexContentCell(content.learning) ] }),
                        new TableRow({ children: [ createContentLabelCell("Application"), createBulletListCell(content.application) ] }),
                        new TableRow({ children: [ createContentLabelCell("Conclusion"), createContentValueCell(content.conclusion) ] }),
                    ]
                }),
            ],
        }]
    });


    const docBuffer = await Packer.toBuffer(doc);
    const filename = `Reflective_Journal_${sanitizeFilename(data.fullName)}.docx`;

    revalidatePath("/");

    return {
      filename,
      content: Buffer.from(docBuffer).toString("base64"),
    };
  } catch (error) {
    console.error("[generateDocument Error]", error);
    let errorMessage = "An unexpected error occurred while generating the document. Please try again.";
    if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            errorMessage = "Header image not found at 'public/templates/aurora_header.png'. Please ensure the file exists.";
        } else {
            errorMessage = `Error: ${error.message}. Please check the server logs for more details.`;
        }
    }
    return {
      error: errorMessage,
    };
  }
}
