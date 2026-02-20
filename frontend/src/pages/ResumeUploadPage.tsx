import { useState } from "react";
import { mockResume } from "@/data/mockData";
import { PageHeader } from "@/components/shared/PageComponents";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ResumeUploadPage = () => {
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
    toast.success("Resume uploaded and parsed successfully!");
  };

  return (
    <div>
      <PageHeader title="Resume" subtitle="Upload and manage your resume." />

      {!uploaded ? (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleUpload(); }}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">Upload Your Resume</h3>
          <p className="text-sm text-muted-foreground mb-6">Drag & drop a PDF or DOCX file, or click to browse</p>
          <Button onClick={handleUpload} className="gap-2">
            <FileText className="w-4 h-4" /> Choose File
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Resume parsed successfully</span>
          </div>

          {/* Contact Info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{mockResume.name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{mockResume.email}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium text-foreground">{mockResume.phone}</span></div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Summary</h3>
            <p className="text-sm text-muted-foreground">{mockResume.summary}</p>
          </div>

          {/* Skills */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {mockResume.skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">{skill}</span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Experience</h3>
            <div className="space-y-4">
              {mockResume.experience.map((exp, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-4">
                  <h4 className="font-semibold text-foreground">{exp.title}</h4>
                  <p className="text-sm text-accent font-medium">{exp.company} • {exp.duration}</p>
                  <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Education</h3>
            <div className="space-y-2">
              {mockResume.education.map((edu, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-foreground">{edu.degree}</span>
                    <span className="text-muted-foreground"> — {edu.school}</span>
                  </div>
                  <span className="text-muted-foreground">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUploadPage;
