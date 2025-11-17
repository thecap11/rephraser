"use client";

import { CheckCircle2, Download, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

type DownloadSectionProps = {
  filename: string;
  content: string; // base64 content
  onReset: () => void;
};

export default function DownloadSection({
  filename,
  content,
  onReset,
}: DownloadSectionProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${content}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full shadow-lg text-center animate-in fade-in-50">
      <CardHeader>
        <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <CardTitle className="font-headline text-2xl mt-4">
          Journal Created Successfully!
        </CardTitle>
        <CardDescription>
          Your rephrased document is ready for submission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary rounded-md p-4 border border-dashed text-center">
            <p className="text-sm text-muted-foreground">File:</p>
            <p className="font-medium text-foreground break-all">{filename}</p>
        </div>
      </CardContent>
      <CardFooter className="flex-col sm:flex-row gap-2">
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
        <Button onClick={onReset} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Create Another
        </Button>
      </CardFooter>
    </Card>
  );
}
