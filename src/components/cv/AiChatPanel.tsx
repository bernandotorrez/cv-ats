import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAi } from "@/lib/ai-functions";
import { toast } from "sonner";
import { Send, Loader2, Sparkles } from "lucide-react";
import type { CvData } from "@/lib/cv-types";

interface Props {
  cvId: string;
  cvData: CvData;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: ChatMsg[] = [
  {
    role: "assistant",
    content:
      "Halo! Saya asisten AI untuk CV kamu. Saya bisa bantu:\n\n• Menyusun kalimat deskripsi pengalaman\n• Memberi saran keyword yang tepat\n• Memperbaiki ringkasan profil\n• Menjawab pertanyaan seputar CV ATS\n\nApa yang bisa saya bantu?",
  },
];

export function AiChatPanel({ cvId, cvData }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build context about the CV
      const cvContext = `KONTEKS CV SEDANG DIEDIT:\n- Nama: ${cvData.personal.fullName || "(belum diisi)"}\n- Posisi: ${cvData.personal.headline || "(belum diisi)"}\n- Ringkasan: ${cvData.personal.summary || "(belum diisi)"}\n- Pengalaman: ${cvData.experiences.length} entri\n- Pendidikan: ${cvData.educations.length} entri\n- Skill: ${cvData.skills.map((s) => s.name).join(", ") || "(belum diisi)"}`;

      const allMessages = [
        ...messages,
        userMsg,
      ];

      // Add cv context to the last user message
      const msgsForApi = allMessages.map((m, i) => {
        if (i === allMessages.length - 1 && m.role === "user") {
          return { role: m.role, content: `${cvContext}\n\nPERTANYAAN: ${m.content}` };
        }
        return { role: m.role, content: m.content };
      });

      const result = await chatWithAi({
        data: {
          cvId,
          messages: msgsForApi,
        },
      });

      setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
    } catch (e: any) {
      toast.error(e.message || "Gagal menghubungi AI");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Panduan AI</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2 space-y-3 text-sm">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs text-muted-foreground">AI mengetik...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya AI tentang CV kamu..."
          rows={2}
          className="min-h-0 resize-none text-sm"
          disabled={loading}
        />
        <Button
          size="sm"
          className="h-auto self-end"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
