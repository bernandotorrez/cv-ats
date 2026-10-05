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
        "flex min-h-14 cursor-pointer select-none items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
        "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50",
        isActive && "border-green-600 bg-green-50 hover:border-green-600 hover:bg-green-50",
        isDragging && "relative z-50 opacity-80 shadow-xl",
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
          "-ml-1 shrink-0 cursor-grab rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700",
        )}
        aria-label={`Seret ${section.label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Icon */}
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isActive ? "bg-green-700 text-white" : "bg-green-100 text-green-800",
        )}
      >
        {section.icon}
      </span>

      {/* Label */}
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-gray-900">
        {section.label}
      </span>

      {typeof itemCount === "number" && section.id !== "personal" && section.id !== "ats" && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
            itemCount > 0 ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-900",
          )}
        >
          {itemCount > 0 ? `${itemCount} item` : "Kosong"}
        </span>
      )}

      {section.id === "ats" && typeof itemCount === "number" && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
            itemCount >= 80
              ? "bg-green-100 text-green-800"
              : itemCount >= 60
                ? "bg-amber-100 text-amber-900"
                : "bg-red-100 text-red-800",
          )}
        >
          Skor {itemCount}
        </span>
      )}

      {OPTIONAL_SECTIONS.includes(section.id) && onRemove && (
        <button
          className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
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
          "h-4 w-4 shrink-0 transition-transform",
          isActive ? "rotate-180 text-green-700" : "text-gray-500",
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
    <nav className={cn("flex flex-col gap-2", className)} aria-label="Navigasi Section CV">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
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
                  <div className="mb-4 mt-2">
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
