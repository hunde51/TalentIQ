import { useState } from "react";
import { mockCoverLetter } from "@/data/mockData";
import { PageHeader } from "@/components/shared/PageComponents";
import { Copy, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CoverLetterPage = () => {
  const [content, setContent] = useState(mockCoverLetter);
  const [regenerating, setRegenerating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setContent(mockCoverLetter + "\n\nP.S. I am particularly excited about the innovative work your team is doing in this space.");
      setRegenerating(false);
      toast.success("Cover letter regenerated!");
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Cover Letter" subtitle="AI-generated cover letter for your application.">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          <Copy className="w-4 h-4" /> Copy
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" /> Download
        </Button>
        <Button size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} /> Regenerate
        </Button>
      </PageHeader>

      <div className="bg-card border border-border rounded-xl p-6">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] border-0 p-0 resize-none text-sm leading-relaxed focus-visible:ring-0 bg-transparent text-foreground"
        />
      </div>
    </div>
  );
};

export default CoverLetterPage;
