import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, FileText, Sparkles, ArrowRight } from "lucide-react";
import { templatesData } from "@/lib/cv-templates-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { previewData } from "@/components/site/TemplatePreview";

// Import all templates
import { BandungTemplate } from "@/components/cv/templates/BandungTemplate";
import { BaliTemplate } from "@/components/cv/templates/BaliTemplate";
import { JakartaTemplate } from "@/components/cv/templates/JakartaTemplate";
import { MakassarTemplate } from "@/components/cv/templates/MakassarTemplate";
import { MedanTemplate } from "@/components/cv/templates/MedanTemplate";
import { SemarangTemplate } from "@/components/cv/templates/SemarangTemplate";
import { SurabayaTemplate } from "@/components/cv/templates/SurabayaTemplate";
import { YogyaTemplate } from "@/components/cv/templates/YogyaTemplate";
import { MalangTemplate } from "@/components/cv/templates/MalangTemplate";
import { UbudTemplate } from "@/components/cv/templates/UbudTemplate";
import { BogorTemplate } from "@/components/cv/templates/BogorTemplate";

const templateComponents = {
  bali: BaliTemplate,
  jakarta: JakartaTemplate,
  makassar: MakassarTemplate,
  bandung: BandungTemplate,
  medan: MedanTemplate,
  semarang: SemarangTemplate,
  surabaya: SurabayaTemplate,
  yogya: YogyaTemplate,
  malang: MalangTemplate,
  ubud: UbudTemplate,
  bogor: BogorTemplate,
};

export function TemplateGallery() {
  const [filter, setFilter] = useState<"Semua" | "ATS-Friendly" | "Kreatif">("Semua");

  const filteredTemplates = useMemo(() => {
    if (filter === "Semua") return templatesData;
    return templatesData.filter((t) => t.type === filter);
  }, [filter]);

  return (
    <section className="py-20 bg-gray-50/50 border-t border-gray-100" id="template-gallery">
      <div className="container-page">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            {templatesData.length}+ Template <span className="text-green-700">ATS & Kreatif</span> Tersedia
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Template CV yang dirancang oleh ahli HR & recruiter — lolos screening sistem ATS, tetap terlihat profesional di mata manusia.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm md:text-base font-medium text-gray-700 mb-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-700" />
              <span>Lolos ATS<br/><span className="text-gray-500 font-normal text-xs">(ATS-Optimized)</span></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-700" />
              <span>Format Profesional<br/><span className="text-gray-500 font-normal text-xs">& Terstruktur</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-700" />
              <span>Tampilan Menarik<br/><span className="text-gray-500 font-normal text-xs">di Mata Recruiter</span></span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-3">
            <Button
              variant={filter === "Semua" ? "default" : "secondary"}
              className={`rounded-full px-8 ${filter === "Semua" ? "bg-green-700 hover:bg-green-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              onClick={() => setFilter("Semua")}
            >
              Semua
            </Button>
            <Button
              variant={filter === "ATS-Friendly" ? "default" : "secondary"}
              className={`rounded-full px-8 ${filter === "ATS-Friendly" ? "bg-green-700 hover:bg-green-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              onClick={() => setFilter("ATS-Friendly")}
            >
              ATS-Friendly
            </Button>
            <Button
              variant={filter === "Kreatif" ? "default" : "secondary"}
              className={`rounded-full px-8 ${filter === "Kreatif" ? "bg-green-700 hover:bg-green-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              onClick={() => setFilter("Kreatif")}
            >
              Kreatif
            </Button>
          </div>
        </div>

        {/* Template Marquee */}
        <div className="relative flex overflow-hidden w-full group mask-image-marquee">
          <style dangerouslySetInnerHTML={{__html: `
            .mask-image-marquee {
              mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
              -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 35s linear infinite;
              min-width: 200%;
            }
            .group:hover .animate-marquee {
              animation-play-state: paused;
            }
          `}} />
          <div className="flex gap-6 animate-marquee py-4 w-max">
            {[...filteredTemplates, ...filteredTemplates].map((template, idx) => {
              const TemplateComponent = templateComponents[template.slug as keyof typeof templateComponents];
              
              return (
                <Card key={`${template.slug}-${idx}`} className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 flex flex-col">
                  {/* Image / Preview Area */}
                  <div className="relative bg-gray-50 p-4 aspect-[3/4] overflow-hidden flex items-center justify-center">
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded ${template.type === "Kreatif" ? "bg-teal-500" : "bg-green-700"}`}>
                        {template.type === "Kreatif" ? "KREATIF" : "ATS OPTIMIZED"}
                      </span>
                    </div>

                    {/* Render Component scaled down */}
                    <div className="relative w-full h-full overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
                      <div
                          className="absolute left-0 top-0"
                          style={{
                            transform: "scale(0.35)",
                            transformOrigin: "top left",
                            width: "285%",
                            height: "285%",
                          }}
                        >
                          <div style={{ pointerEvents: "none" }}>
                            {TemplateComponent ? <TemplateComponent data={(previewData as any)[template.slug] || (previewData as any).jakarta} showHeader={true} /> : null}
                          </div>
                        </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/5 transition-colors z-10" />
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-5 flex flex-col gap-4 border-t border-gray-100 mt-auto">
                    <h3 className="font-display font-bold text-lg text-gray-900">
                      {template.name}
                    </h3>
                    
                    <Button asChild className="w-full bg-green-700 hover:bg-green-800 text-white rounded-lg group/btn">
                      <Link to="/register">
                        Gunakan Template
                        <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
