import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { chatWithAi } from "@/lib/ai-functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Pause,
  Play,
  Save,
} from "lucide-react";
import type { CvData } from "@/lib/cv-types";

interface Props {
  cvId: string;
  cvData: CvData;
  onComplete: (data: CvData) => void;
  onCancel: () => void;
}

interface ChatMessage {
  role: "ai" | "user";
  content: string;
}

interface Step {
  key: string;
  question: string;
  field: keyof CvData | string;
}

const GUIDED_STEPS: Step[] = [
  {
    key: "greeting",
    question: "Halo! Saya akan bantu kamu mengisi CV step by step. Siap? Yuk mulai! Pertama, posisi apa yang sedang kamu lamar?",
    field: "personal.headline",
  },
  {
    key: "summary",
    question: "Ceritakan tentang dirimu secara singkat. Apa keahlian utamamu dan kenapa kamu cocok untuk posisi ini?",
    field: "personal.summary",
  },
  {
    key: "experience_count",
    question: "Bagus! Sekarang, berapa pengalaman kerja yang ingin kamu cantumkan? (contoh: 2 atau 3)",
    field: "experience_count",
  },
  {
    key: "experience_detail",
    question: "Ceritakan pengalaman kerjamu yang paling relevan. Sebutkan: nama perusahaan, posisi, dan apa pencapaian terbesarmu di sana.",
    field: "experiences",
  },
  {
    key: "education",
    question: "Apa pendidikan terakhirmu? Sebutkan: universitas/sekolah, jurusan, dan tahun lulus.",
    field: "educations",
  },
  {
    key: "skills",
    question: "Skill apa yang paling ingin kamu tonjolkan? Sebutkan hard skills dan soft skills yang relevan dengan posisi target.",
    field: "skills",
  },
  {
    key: "complete",
    question: "CV kamu sudah siap! Klik 'Lihat Hasil' untuk review dan edit sebelum download.",
    field: "complete",
  },
];

interface GuidedState {
  currentStep: number;
  messages: ChatMessage[];
  draftData: Partial<CvData>;
  pausedAt?: string;
}

export function GuidedMode({ cvId, cvData, onComplete, onCancel }: Props) {
  // Try to restore saved state
  const savedState = (cvData as any)._guided as GuidedState | undefined;
  const hasSavedState = savedState && savedState.currentStep > 0;

  const [currentStep, setCurrentStep] = useState(savedState?.currentStep ?? 0);
  const [messages, setMessages] = useState<ChatMessage[]>(
    savedState?.messages ?? [{ role: "ai", content: GUIDED_STEPS[0].question }],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(!!savedState?.pausedAt);
  const [draftData, setDraftData] = useState<Partial<CvData>>(savedState?.draftData ?? {});
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const step = GUIDED_STEPS[currentStep];
  const progress = Math.round(((currentStep + 1) / GUIDED_STEPS.length) * 100);

  // Persist state to CV data
  const saveState = async (state: GuidedState & { pausedAt?: string }) => {
    setSaving(true);
    try {
      const { data: existing } = await (supabase as any)
        .from("cvs").select("data").eq("id", cvId).single();
      const currentData = existing?.data ?? {};
      await (supabase as any)
        .from("cvs")
        .update({ data: { ...currentData, _guided: state } })
        .eq("id", cvId);
    } catch (e: any) {
      toast.error("Gagal menyimpan progress");
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    const state: GuidedState & { pausedAt: string } = {
      currentStep,
      messages,
      draftData,
      pausedAt: new Date().toISOString(),
    };
    setPaused(true);
    await saveState(state);
    toast.success("Progress disimpan. Lanjutkan kapan saja.");
  };

  const handleResume = () => {
    setPaused(false);
  };

  const handleClearAndCancel = async () => {
    // Clear saved state
    const { data: existing } = await (supabase as any)
      .from("cvs").select("data").eq("id", cvId).single();
    const currentData = existing?.data ?? {};
    const { _guided, ...rest } = currentData;
    await (supabase as any).from("cvs").update({ data: rest }).eq("id", cvId);
    onCancel();
  };

  const aiSend = async (userInput: string) => {
    setLoading(true);
    try {
      // Parse user's response with AI
      const context = `Sedang dalam mode panduan step-by-step CV. Step: ${step.key}. Data CV yang sudah terkumpul: ${JSON.stringify(draftData)}.`;
      const msgs = [
        { role: "user" as const, content: `${context}\n\nJawaban pengguna untuk step "${step.key}": ${userInput}\n\nEkstrak informasi relevan dalam format JSON dan berikan respons dalam Bahasa Indonesia yang mendorong dan natural. 

Format respons JSON:
{
  "reply": "respons natural dalam Bahasa Indonesia",
  "extracted": {
    // data yang diekstrak sesuai step
  }
}

Panduan ekstraksi per step:
- greeting/headline: { "personal": { "headline": "posisi yang dilamar" } }
- summary: { "personal": { "summary": "ringkasan profesional" } }
- experience_count: { "experience_count": jumlah }
- experience_detail: { "experiences": [{ "id": "exp-1", "company": "", "position": "", "startDate": "2020-01", "endDate": "2023-12", "description": "" }] }
- education: { "educations": [{ "id": "edu-1", "school": "", "degree": "", "field": "", "startDate": "2016-08", "endDate": "2020-06" }] }
- skills: { "skills": [{ "id": "skill-1", "name": "skill1", "level": "Intermediate" }] }

PENTING: 
- Untuk experiences, educations, dan skills, WAJIB generate ID unik (exp-1, edu-1, skill-1, dst)
- Untuk tanggal gunakan format YYYY-MM atau YYYY
- Untuk level skill gunakan: Beginner, Intermediate, Advanced, atau Expert

Jika ini step terakhir, beri rangkuman dan katakan CV sudah siap.` },
      ];

      const result = await chatWithAi({
        data: { cvId, messages: msgs, jsonMode: true },
      });

      // Parse JSON response
      let reply = result.reply;
      let extracted: any = {};
      
      try {
        const parsed = JSON.parse(result.reply);
        reply = parsed.reply || result.reply;
        extracted = parsed.extracted || {};
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        // Fallback: try to extract JSON from text
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            reply = parsed.reply || result.reply;
            extracted = parsed.extracted || {};
          } catch {
            // Use reply as-is if all parsing fails
          }
        }
      }

      return { reply, extracted };
    } catch (e: any) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const userInput = input.trim();
    if (!userInput && step.key !== "greeting") return;

    // Add user message
    const newMessages = [...messages];
    if (userInput) {
      newMessages.push({ role: "user", content: userInput });
    }
    setMessages(newMessages);
    setInput("");

    if (step.key === "complete") {
      // Clear saved state
      const { data: existing } = await (supabase as any)
        .from("cvs").select("data").eq("id", cvId).single();
      const currentData = existing?.data ?? {};
      const { _guided, ...rest } = currentData;
      await (supabase as any).from("cvs").update({ data: rest }).eq("id", cvId);
      onComplete(draftData as CvData);
      return;
    }

    // Process with AI
    try {
      const { reply, extracted } = await aiSend(userInput);
      newMessages.push({ role: "ai", content: reply });
      setMessages(newMessages);

      // Update draft data with extracted information
      if (extracted && Object.keys(extracted).length > 0) {
        setDraftData((prev) => {
          const updated: any = { ...prev };
          
          // Merge extracted data
          Object.keys(extracted).forEach((key) => {
            if (key === 'personal') {
              updated.personal = { ...updated.personal, ...extracted[key] };
            } else if (key === 'experiences' && Array.isArray(extracted[key])) {
              updated.experiences = [...(updated.experiences || []), ...extracted[key]];
            } else if (key === 'educations' && Array.isArray(extracted[key])) {
              updated.educations = [...(updated.educations || []), ...extracted[key]];
            } else if (key === 'skills' && Array.isArray(extracted[key])) {
              updated.skills = [...(updated.skills || []), ...extracted[key]];
            } else {
              updated[key] = extracted[key];
            }
          });
          
          return updated;
        });
      }

      // Move to next step
      const nextStep = currentStep + 1;
      if (nextStep < GUIDED_STEPS.length) {
        setCurrentStep(nextStep);
        newMessages.push({ role: "ai", content: GUIDED_STEPS[nextStep].question });
        setMessages([...newMessages]);
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal memproses");
    }
  };

  const handleSkip = () => {
    const nextStep = currentStep + 1;
    if (nextStep < GUIDED_STEPS.length) {
      setCurrentStep(nextStep);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `Baik, kita lewati. ${GUIDED_STEPS[nextStep].question}` },
      ]);
    } else {
      onComplete(draftData as CvData);
    }
  };

  const handlePrev = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    setMessages((prev) => [
      ...prev,
      { role: "ai", content: `Kita kembali ke step sebelumnya. ${GUIDED_STEPS[prevStep].question}` },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Panduan AI — Isi CV Step by Step
            </CardTitle>
            {hasSavedState && currentStep > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Save className="h-3 w-3 mr-1" /> Progress tersimpan
              </Badge>
            )}
          </div>
          <Badge variant="secondary">
            Langkah {currentStep + 1} dari {GUIDED_STEPS.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5" />
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "ai" && (
                  <Sparkles className="h-3 w-3 inline mr-1 text-primary opacity-70" />
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">AI mengetik...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        {step.key !== "complete" && !paused && (
          <div className="shrink-0 border-t border-border p-4 space-y-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik jawabanmu di sini..."
              rows={3}
              className="min-h-0 resize-none text-sm"
              disabled={loading}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0 || loading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={loading}
              >
                Lewati
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePause}
                disabled={loading || saving}
                className="gap-1"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                Simpan & Lanjut Nanti
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAndCancel}
                disabled={loading}
              >
                Keluar
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={loading || (!input.trim() && currentStep > 0)}
                className="gap-1"
              >
                Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Paused State */}
        {paused && step.key !== "complete" && (
          <div className="shrink-0 border-t border-border p-6 text-center space-y-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary mx-auto">
              <Save className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">Progress Disimpan</h3>
            <p className="text-sm text-muted-foreground">
              Progress kamu sudah tersimpan. Lanjutkan kapan saja dari dashboard.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={handleClearAndCancel}>
                Keluar
              </Button>
              <Button size="sm" onClick={handleResume} className="gap-1">
                <Play className="h-4 w-4" /> Lanjutkan
              </Button>
            </div>
          </div>
        )}

        {/* Complete step */}
        {step.key === "complete" && (
          <div className="shrink-0 border-t border-border p-4 space-y-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-display text-lg font-semibold">CV Siap Direview!</h3>
            <p className="text-sm text-muted-foreground">
              AI telah menyusun draft CV berdasarkan jawabanmu. Review dan edit sebelum download.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleClearAndCancel}>
                Isi Sendiri
              </Button>
              <Button onClick={() => onComplete(draftData as CvData)} className="gap-1">
                Lihat Hasil <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
