# **App Name**: Journal Reframer

## Core Features:

- File Upload and Extraction: Accepts .docx files, extracts text content while ignoring header images and formatting details that are not relevant for rephrasing. Retains document structure for later reconstruction.
- AI-Powered Rephrasing: Utilizes OpenAI GPT to rephrase extracted content, preserving the academic tone. Offers a tool to adjust the 'creativity level' of rephrasing.
- Student Personalization: Collects student details (name, roll number, etc.) via a form and automatically replaces corresponding information within the document.
- Document Reconstruction: Reconstructs the .docx file using python-docx, reapplying the original formatting, styles, and layout.
- Downloadable Output: Generates a downloadable .docx file with a standardized filename, storing outputs temporarily before deletion.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) to evoke a sense of intellect and academic rigor.
- Background color: Very light lavender (#F0F2FA) for a clean and professional feel.
- Accent color: Electric purple (#BE92E6) to highlight important actions.
- Headline font: 'Belleza', a humanist sans-serif that suggests fashion, art and design; body font: 'Alegreya', a serif that complements it beautifully.
- Use clear, professional icons to represent actions like uploading, downloading, and generating documents.
- A clean, responsive layout that works well on both desktop and mobile devices.
- Subtle animations to provide feedback on actions, such as a loading indicator during document generation.