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
  Briefcase,
  GraduationCap,
  Wrench,
  Languages,
  Award,
  GripVertical,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  className?: string;
}

function SortableSection({
  section,
  isActive,
  onSelect,
}: {
  section: SectionDef;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer select-none transition-all",
        "hover:bg-muted/80",
        isActive && "bg-primary/10 text-primary font-medium shadow-sm",
        isDragging && "opacity-50 z-50 bg-card shadow-lg",
      )}
      onClick={() => onSelect(section.id)}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`Section ${section.label}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(section.id);
        }
      }}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 -ml-1 rounded"
        aria-label={`Seret ${section.label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Icon */}
      <span className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}>
        {section.icon}
      </span>

      {/* Label */}
      <span className="truncate">{section.label}</span>
    </div>
  );
}

export function SectionsNav({
  sections,
  activeSection,
  onSelectSection,
  onReorderSections,
  className,
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
    <nav
      className={cn("flex flex-col gap-0.5", className)}
      aria-label="Navigasi Section CV"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Section
        </h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onSelect={onSelectSection}
              />
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
    { id: "experience", label: t(lang, "workExperience"), icon: <Briefcase className="h-4 w-4" /> },
    { id: "education", label: t(lang, "education"), icon: <GraduationCap className="h-4 w-4" /> },
    { id: "skills", label: t(lang, "skills"), icon: <Wrench className="h-4 w-4" /> },
    { id: "extras", label: t(lang, "extras"), icon: <Award className="h-4 w-4" /> },
    { id: "ats", label: t(lang, "atsView"), icon: <Eye className="h-4 w-4" /> },
  ];
}
