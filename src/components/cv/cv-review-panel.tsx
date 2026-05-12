/**
 * CV Review Panel - HR AI Review Component
 * Persona: Senior HR Recruitment Expert (20+ years experience)
 * Available for: Starter & Pro tiers only
 */

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  UserCircle,
  Briefcase,
  FileText,
  Target,
  Lightbulb,
  Zap,
  Clock,
  Award,
  ThumbsUp,
  AlertCircle,
  ChevronRight,
  Lock,
  Crown,
  StarIcon,
  MessageSquare,
  RefreshCw,
  Download,
} from "lucide-react";

interface CVReviewPanelProps {
  cvData: Record<string, unknown>;
  cvId?: string;
  onReviewComplete?: (review: CVReviewResult) => void;
  className?: string;
}

interface CVReviewResult {
  reviewer: {
    name: string;
    title: string;
    experience: string;
  };
  scores: {
    overall: number;
    firstImpression: number;
    format: number;
    content: number;
    achievement: number;
    presentation: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  industryBenchmark: {
    level?: string;
    comparison?: string;
    percentile?: string;
  };
  hrVerdict: {
    verdict?: string;
    reason?: string;
    nextSteps?: string[];
  };
  quickWins: string[];
}

interface Suggestion {
  priority: "high" | "medium" | "low";
  category: string;
  current: string;
  suggested: string;
  impact: string;
}

export function CVReviewPanel({ cvData, cvId, onReviewComplete, className }: CVReviewPanelProps) {
  const { user, tier } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<CVReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const canAccess = tier === "starter" || tier === "pro";
  const isStarter = tier === "starter";

  const handleReview = async () => {
    if (!user) {
      setError("Silakan login terlebih dahulu");
      return;
    }

    setIsLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const response = await fetch("/api/ai-cv-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.session?.access_token}`,
        },
        body: JSON.stringify({
          cvData,
          cvId,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setError("Fitur ini hanya tersedia untuk paket Starter dan Pro");
        } else {
          setError(data.error || "Terjadi kesalahan saat review CV");
        }
        return;
      }

      setReviewResult(data.review);
      if (onReviewComplete) {
        onReviewComplete(data.review);
      }
    } catch (err) {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getVerdictConfig = (verdict: string) => {
    if (verdict?.includes("Lolos Tahap Awal") || verdict?.includes("Tahap Akhir")) {
      return { bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-500", text: "text-green-700 dark:text-green-400", icon: CheckCircle2 };
    }
    if (verdict?.includes("Tahap Menengah")) {
      return { bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-500", text: "text-yellow-700 dark:text-yellow-400", icon: Clock };
    }
    return { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-500", text: "text-red-700 dark:text-red-400", icon: AlertCircle };
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return <Badge variant="destructive" className="text-xs">Tinggi</Badge>;
    }
    if (priority === "medium") {
      return <Badge variant="secondary" className="text-xs">Sedang</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Rendah</Badge>;
  };

  // Upgrade prompt for non-eligible users
  if (!canAccess) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Review CV by HR Expert</h3>
              <p className="text-sm text-muted-foreground">
                Fitur eksklusif untuk paket Starter & Pro
              </p>
            </div>
            <Button asChild size="sm">
              <a href="/harga">Upgrade</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant={isStarter ? "outline" : "default"}>
          <Sparkles className="h-4 w-4" />
          Review CV by HR
          {!isStarter && <Badge className="ml-1 bg-amber-500">Pro</Badge>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <UserCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Review CV by HR Expert</DialogTitle>
              <DialogDescription>
                Analisis mendalam dari HR profesional dengan pengalaman 20+ tahun
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!reviewResult ? (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* HR Persona Info */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">HA</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-400">Hira AI</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-500">Senior HR Recruitment Consultant</p>
                    <p className="text-xs text-amber-600 dark:text-amber-600">20+ tahun pengalaman • Fortune 500 Hiring Expert</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optional Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Posisi yang ditarget (opsional)</label>
                <Input 
                  placeholder="Contoh: Software Engineer, Marketing Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Job Description / Lowongan (opsional)</label>
                <Textarea 
                  placeholder="Tempelkan deskripsi lowongan untuk analisis yang lebih akurat..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            <Button 
              onClick={handleReview} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menganalisis CV...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mulai Review CV
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Review akan memakan waktu sekitar 10-30 detik
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="border-2 border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Skor Keseluruhan</p>
                      <p className={`text-5xl font-bold ${getScoreColor(reviewResult.scores.overall)}`}>
                        {reviewResult.scores.overall}
                        <span className="text-2xl">/100</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        <Crown className="w-4 h-4 mr-1 text-amber-500" />
                        HR Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "First Impression", score: reviewResult.scores.firstImpression, icon: Star },
                  { label: "Format & ATS", score: reviewResult.scores.format, icon: FileText },
                  { label: "Konten", score: reviewResult.scores.content, icon: MessageSquare },
                  { label: "Pencapaian", score: reviewResult.scores.achievement, icon: Trophy },
                  { label: "Presentasi", score: reviewResult.scores.presentation, icon: Award },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-3 text-center">
                    <item.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>{item.score}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* HR Verdict */}
              {reviewResult.hrVerdict?.verdict && (
                <Card className={getVerdictConfig(reviewResult.hrVerdict.verdict).bg}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const config = getVerdictConfig(reviewResult.hrVerdict?.verdict || "");
                        const Icon = config.icon;
                        return (
                          <>
                            <Icon className={`h-6 w-6 mt-0.5 ${config.text}`} />
                            <div className="flex-1">
                              <h4 className={`font-semibold ${config.text}`}>
                                {reviewResult.hrVerdict.verdict}
                              </h4>
                              <p className="text-sm mt-1 opacity-80">
                                {reviewResult.hrVerdict.reason}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Wins */}
              {reviewResult.quickWins && reviewResult.quickWins.length > 0 && (
                <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Zap className="h-5 w-5" />
                      Quick Wins - Perubahan Cepat!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {reviewResult.quickWins.map((win, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                          {win}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="strengths" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="strengths">Kekuatan</TabsTrigger>
                  <TabsTrigger value="weaknesses">Kelemahan</TabsTrigger>
                  <TabsTrigger value="suggestions">Saran</TabsTrigger>
                </TabsList>

                <TabsContent value="strengths" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <ul className="space-y-3">
                        {reviewResult.strengths.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="weaknesses" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <ul className="space-y-3">
                        {reviewResult.weaknesses.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="suggestions" className="mt-4">
                  <div className="space-y-4">
                    {reviewResult.suggestions.map((suggestion, i) => (
                      <Card key={i} className={
                        suggestion.priority === "high" 
                          ? "border-l-4 border-l-red-500" 
                          : suggestion.priority === "medium"
                            ? "border-l-4 border-l-yellow-500"
                            : "border-l-4 border-l-green-500"
                      }>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {suggestion.category}
                              </Badge>
                              {getPriorityBadge(suggestion.priority)}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm">
                              <p className="font-medium text-red-600 dark:text-red-400 line-through opacity-60">
                                {suggestion.current}
                              </p>
                              <ChevronRight className="inline h-4 w-4 mx-1" />
                              <p className="font-medium text-green-700 dark:text-green-400">
                                {suggestion.suggested}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              {suggestion.impact}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Industry Benchmark */}
              {reviewResult.industryBenchmark?.level && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">📊 Benchmark Industri</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>{reviewResult.industryBenchmark.level?.replace("_", " ").toUpperCase()}</Badge>
                      <span className="text-muted-foreground">
                        {reviewResult.industryBenchmark.percentile}
                      </span>
                    </div>
                    <p>{reviewResult.industryBenchmark.comparison}</p>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {reviewResult.hrVerdict?.nextSteps && reviewResult.hrVerdict.nextSteps.length > 0 && (
                <Card className="border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Langkah Selanjutnya
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {reviewResult.hrVerdict.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setReviewResult(null)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Review Ulang
                </Button>
                <Button className="flex-1" onClick={() => setIsOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
