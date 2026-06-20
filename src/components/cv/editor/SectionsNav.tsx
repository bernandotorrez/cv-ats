import { cn } from "@/lib/utils";
import { t, type CvUiLang } from "@/lib/cv-translations";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  User,
  Users,
  Briefcase,
  Building2,
  GraduationCap,
  Wrench,
  Languages,
  Award,
  GripVertical,
  Eye,
  ChevronDown,
  X,
} from "lucide-react";

export interface SectionDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  sections: SectionDef[];
  activeSection: string;
  onSelectSection: (id: string) => void;
  onReorderSections: (sections: SectionDef[]) => void;
  onRemoveSection?: (id: string) => void;
  className?: string;
  itemCounts?: Record<string, number>;
  children?: React.ReactNode;
  renderSectionContent?: (sectionId: string) => React.ReactNode;
}

const OPTIONAL_SECTIONS = ["internship", "organization", "certificate"];

function SortableSection({
  section,
  isActive,
  onSelect,
  itemCount,
  onRemove,
}: {
  section: SectionDef;
  isActive: boolean;
  onSelect: (id: string) => void;
  itemCount?: number;
  onRemove?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex min-h-[86px] cursor-pointer select-none items-center gap-4 rounded-2xl border px-4 py-4 text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        "border-border bg-background shadow-sm shadow-slate-900/5 hover:border-primary/30 hover:bg-primary/5",
        isActive && "border-primary/40 bg-primary/10 ring-1 ring-primary/15",
        isDragging && "opacity-50 z-50 bg-card shadow-lg",
      )}
      onClick={() => onSelect(isActive ? "" : section.id)}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`Section ${section.label}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(isActive ? "" : section.id);
        }
      }}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "shrink-0 cursor-grab rounded p-0.5 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
          isActive
            ? "text-primary hover:text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={`Seret ${section.label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Icon */}
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {section.icon}
      </span>

      {/* Label */}
      <span className="min-w-0 flex-1 truncate text-lg font-bold text-foreground">
        {section.label}
      </span>

      {typeof itemCount === "number" && section.id !== "personal" && section.id !== "ats" && (
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-sm font-bold",
            itemCount > 0 ? "bg-primary/10 text-primary" : "bg-rose-100 text-rose-600",
          )}
        >
          {itemCount} items
        </span>
      )}

      {section.id === "ats" && typeof itemCount === "number" && (
        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
          {itemCount}
        </span>
      )}

      {OPTIONAL_SECTIONS.includes(section.id) && onRemove && (
        <button
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/25"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(section.id);
          }}
          aria-label={`Hapus bagian ${section.label}`}
          title={`Hapus ${section.label}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <ChevronDown
        className={cn(
          "h-5 w-5 shrink-0 transition-transform",
          isActive ? "rotate-180 text-primary" : "text-muted-foreground",
        )}
      />
    </div>
  );
}

export function SectionsNav({
  sections,
  activeSection,
  onSelectSection,
  onReorderSections,
  onRemoveSection,
  className,
  itemCounts,
  children,
  renderSectionContent,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(oldIndex, 1);
    newSections.splice(newIndex, 0, moved);
    onReorderSections(newSections);
  };

  return (
    <nav className={cn("flex flex-col gap-3", className)} aria-label="Navigasi Section CV">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id}>
                <SortableSection
                  section={section}
                  isActive={activeSection === section.id}
                  onSelect={onSelectSection}
                  itemCount={itemCounts?.[section.id]}
                  onRemove={onRemoveSection}
                />
                {activeSection === section.id && (
                  <div className="mt-4">
                    {renderSectionContent ? renderSectionContent(section.id) : children}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </nav>
  );
}

// ─── Default Section Definitions ─────────────────────────────────

export function getDefaultSections(lang: CvUiLang = "id"): SectionDef[] {
  return [
    { id: "personal", label: t(lang, "profileAndContact"), icon: <User className="h-4 w-4" /> },
    { id: "education", label: t(lang, "education"), icon: <GraduationCap className="h-4 w-4" /> },
    { id: "experience", label: t(lang, "workExperience"), icon: <Briefcase className="h-4 w-4" /> },
    { id: "skills", label: t(lang, "skills"), icon: <Wrench className="h-4 w-4" /> },
    {
      id: "languages",
      label: t(lang, "languagesSection"),
      icon: <Languages className="h-4 w-4" />,
    },
    { id: "ats", label: t(lang, "atsView"), icon: <Eye className="h-4 w-4" /> },
  ];
}
