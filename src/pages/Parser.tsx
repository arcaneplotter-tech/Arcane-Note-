import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { FileCode, FileJson, Play, RefreshCw, Image as ImageIcon, Settings, X, Type, Move, Plus, Check, Sparkles, CheckSquare, Square, Download, Upload, Layout, Brain, Star, ClipboardList, Lightbulb as ConceptIcon, Trash2, Type as FontIcon, Terminal, Cloud, Maximize2, Save, ArrowLeft, Heart, Box, Sword, Ghost, Zap, Printer, ChevronDown, ChevronUp, Palette, MonitorPlay, Sliders, FileUp, FileDown, Eye, UploadCloud } from 'lucide-react';

const AVAILABLE_TYPES = [
  { id: 'TITLE', description: 'Main document title.', whenToUse: 'At the very beginning of a major topic or document.', whenNotToUse: 'For sub-sections or minor headings.' },
  { id: 'SUBHEADER', description: 'Section headers.', whenToUse: 'To divide a topic into logical sub-sections.', whenNotToUse: 'As the main title or for regular text.' },
  { id: 'BULLET', description: 'Standard bullet points.', whenToUse: 'For lists of related items, features, or characteristics.', whenNotToUse: 'For sequential steps or long paragraphs.' },
  { id: 'EXPLANATION', description: 'Simple explanation with clickable highlights using special syntax. Supports [[concept]] links.', whenToUse: 'When breaking down complex topics. MUST include syntax like [Term]{Title|Def|Simple|Extra} and [[Memory Links]].', whenNotToUse: 'For simple facts that don\'t need deeper explanation.' },
  { id: 'WARNING', description: 'Yellow box for warnings/critical info.', whenToUse: 'For contraindications, side effects, or crucial mistakes to avoid.', whenNotToUse: 'For general information or positive tips.' },
  { id: 'TIP', description: 'Green box for helpful hints/success tips.', whenToUse: 'For best practices, clinical pearls, or helpful advice.', whenNotToUse: 'For critical warnings or standard facts.' },
  { id: 'IMPORTANT', description: 'Red box for high-yield/exam-critical info.', whenToUse: 'For must-know information, exam highlights, or core principles.', whenNotToUse: 'For supplementary or low-yield details.' },
  { id: 'DEFINITION', description: 'Format as "Term: Definition".', whenToUse: 'To define specific vocabulary or terminology.', whenNotToUse: 'For long explanations or processes.' },
  { id: 'CODE', description: 'Monospace font for code/dosages/syntax.', whenToUse: 'For programming code, exact dosages, or specific syntax.', whenNotToUse: 'For regular text or general numbers.' },
  { id: 'QUOTE', description: 'Indented italic text.', whenToUse: 'For direct quotes, historical statements, or notable sayings.', whenNotToUse: 'For standard text or your own explanations.' },
  { id: 'CHECKLIST', description: 'Checkbox style item.', whenToUse: 'For criteria, symptoms to check off, or to-do lists.', whenNotToUse: 'For standard bullet points or unordered facts.' },
  { id: 'EXAMPLE', description: 'Gray box for examples.', whenToUse: 'To provide a concrete scenario or application of a concept.', whenNotToUse: 'For the main definition or core concept itself.' },
  { id: 'FORMULA', description: 'Centered text for math/formulas.', whenToUse: 'For mathematical equations, chemical formulas, or calculations.', whenNotToUse: 'For regular text.' },
  { id: 'CALLOUT', description: 'Purple accented box for side notes.', whenToUse: 'For interesting trivia, related facts, or tangential information.', whenNotToUse: 'For core, must-know information.' },
  { id: 'CONCEPT', description: 'Light blue box for core concepts. Tip: Use [[concept]] to link this concept across the document.', whenToUse: 'To introduce a major overarching idea or framework.', whenNotToUse: 'For minor details or specific examples.' },
  { id: 'MNEMONIC', description: 'Indigo box for memory aids.', whenToUse: 'For acronyms, rhymes, or memory tricks to remember lists.', whenNotToUse: 'For standard explanations.' },
  { id: 'KEY_POINT', description: 'Amber box for essential takeaways.', whenToUse: 'To summarize the most important fact of a section.', whenNotToUse: 'For long, detailed explanations.' },
  { id: 'SUMMARY', description: 'Slate box for section summaries.', whenToUse: 'At the end of a section to recap what was covered.', whenNotToUse: 'At the beginning of a section or for single facts.' },
  { id: 'STEP', description: 'Bold arrow list for sequences.', whenToUse: 'For chronological processes, algorithms, or step-by-step instructions.', whenNotToUse: 'For unordered lists or random facts.' },
  { id: 'TIMELINE', description: 'Format as "Date/Time | Event" for chronological lists.', whenToUse: 'For historical events, disease progression, or schedules.', whenNotToUse: 'For non-time-based lists.' },
  { id: 'DIVIDER', description: 'Horizontal line separator (Content can be empty).', whenToUse: 'To visually separate distinct major sections.', whenNotToUse: 'Between every single item.' },
  { id: 'TABLE_HEAD', description: 'Table headers separated by "|".', whenToUse: 'To define the columns of a table.', whenNotToUse: 'Anywhere outside of a table structure.' },
  { id: 'TABLE_ROW', description: 'Table rows separated by "|".', whenToUse: 'For the data rows of a table.', whenNotToUse: 'Without a preceding TABLE_HEAD.' },
  { id: 'IMG', description: 'Dedicated image block. Upload an image to display it.', whenToUse: 'When you want the user to manually upload a specific image.', whenNotToUse: 'When you want an automatic image search.' },
  { id: 'IMG_TEXT', description: 'Searches Google/Wikipedia for the text and displays the first image. Triple-click to cycle images.', whenToUse: 'To automatically fetch an image for a specific term or concept.', whenNotToUse: 'For abstract concepts that are hard to visualize.' },
  { id: 'MCQ', description: 'Multiple Choice Question. CONTENT must be a JSON string: {"question": "...", "options": ["..."], "answer": "...", "explanation": "..."}', whenToUse: 'To test knowledge with predefined options.', whenNotToUse: 'For open-ended questions.' },
  { id: 'ESSAY', description: 'Open-ended Essay Question. CONTENT must be a JSON string: {"question": "...", "answer": "...", "explanation": "..."}', whenToUse: 'To test deep understanding and require typed answers.', whenNotToUse: 'For simple factual recall.' },
  { id: 'AR_EXPLANATION', description: 'Arabic explanation of a concept (Egyptian dialect).', whenToUse: 'For casual, friendly explanations in Egyptian Arabic. MUST include syntax and links.', whenNotToUse: 'For formal, classical Arabic (Fusha).' },
  { id: 'AR_SIMPLIFY', description: 'Simplified Arabic breakdown (Egyptian dialect).', whenToUse: 'To break down complex topics into very simple Egyptian Arabic terms.', whenNotToUse: 'For advanced, technical deep-dives.' },
  { id: 'AR_DEFINITION', description: 'Arabic definition with medical/technical terms kept in English.', whenToUse: 'To define a term in Arabic while preserving the English scientific name.', whenNotToUse: 'When translating the scientific term itself is required.' },
  { id: 'AR_KEY_POINT', description: 'Key takeaway in Arabic (Egyptian dialect).', whenToUse: 'For the most important takeaway translated into Egyptian Arabic.', whenNotToUse: 'For minor details.' },
  { id: 'AR_EXAMPLE', description: 'Arabic example with English terms preserved.', whenToUse: 'To provide a real-world scenario in Egyptian Arabic.', whenNotToUse: 'For abstract definitions.' },
];
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { isFuzzyMatch, getCleanWords } from '../utils/blurtUtils';
import { parsePdf } from '../utils/pdfParser';
import DocumentRenderer, { type PlacedImage, cn, ImageSettingsModal, DocumentContext, MarkdownContent } from '../components/DocumentRenderer';
import PdfUploader from '../components/PdfUploader';
import HtmlUploader from '../components/HtmlUploader';
import { generatePDF, type CustomFont } from '../utils/pdfGenerator';
import { exportToHTML } from '../utils/htmlExporter';
import { useTheme, type Theme } from '../components/ThemeContext';
import { GameIcon } from '../components/GameIcons';

function DraggableImage({ id, image, onUpdate, onRemove, theme = 'modern' }: { key?: React.Key, id: string, image: PlacedImage, onUpdate: (updates: Partial<PlacedImage>) => void, onRemove: () => void, theme?: Theme }) {
  const [isSelected, setIsSelected] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { image, source: 'extracted' },
    disabled: isSelected
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "relative border-2 overflow-hidden shadow-sm flex justify-center transition-all hover:shadow-md",
        theme === 'modern' && "bg-slate-50 rounded-xl border-slate-200 hover:border-blue-400",
        theme === 'vintage' && "bg-[#fdfbf7] rounded-none border-[#4a3728] hover:bg-[#f4f1ea]",
        theme === 'prism' && "bg-white/40 backdrop-blur-md rounded-2xl border-white/60 hover:border-indigo-400",
        theme === 'professional' && "bg-slate-50 rounded-lg border-slate-200 hover:border-slate-400",
        isDragging ? 'opacity-40 scale-95' : 'opacity-100',
        isSelected && (
          theme === 'vintage' ? 'ring-4 ring-[#4a3728]/20 border-[#4a3728]' :
          theme === 'prism' ? 'ring-4 ring-indigo-500/20 border-indigo-500' :
          theme === 'professional' ? 'ring-4 ring-slate-900/10 border-slate-900' :
          'ring-4 ring-blue-500/20 border-blue-500'
        )
      )}
    >
      <div 
        {...listeners} 
        {...attributes} 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md shadow-lg flex items-center space-x-2 cursor-grab active:cursor-grabbing z-20",
          theme === 'modern' && "bg-slate-900/70 text-white",
          theme === 'vintage' && "bg-[#4a3728] text-[#f4f1ea]",
          theme === 'prism' && "bg-indigo-600/80 text-white",
          theme === 'professional' && "bg-slate-800 text-white"
        )}
      >
        <Move className="w-4 h-4" />
        <span className="text-xs font-bold tracking-wider uppercase">Drag</span>
      </div>

      {!isSelected && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsSelected(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-3 left-3 backdrop-blur-md p-2 rounded-lg shadow-lg flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20",
            theme === 'modern' && "bg-white/90 text-blue-600 hover:bg-blue-50",
            theme === 'vintage' && "bg-[#f4f1ea] text-[#4a3728] hover:bg-[#4a3728] hover:text-[#f4f1ea] border border-[#4a3728]",
            theme === 'prism' && "bg-white/90 text-indigo-600 hover:bg-indigo-50",
            theme === 'professional' && "bg-white text-slate-900 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-wider uppercase">Settings</span>
        </button>
      )}

      {isSelected && (
        <ImageSettingsModal
          image={image}
          onClose={() => setIsSelected(false)}
          onUpdate={onUpdate}
          onRemove={onRemove}
          theme={theme}
        />
      )}

      <div className={cn(
        "w-full flex flex-col", 
        image.hasBorder && (
          theme === 'vintage' ? "border-4 border-[#4a3728] p-1 bg-[#fdfbf7]" :
          theme === 'prism' ? "border-4 border-indigo-500/30 p-1 bg-white" :
          theme === 'professional' ? "border-4 border-slate-800 p-1 bg-white" :
          "border-4 border-slate-800 p-1 bg-white"
        )
      )}>
        <img src={image.url} alt={image.caption || "Extracted"} className="max-w-full h-auto object-contain" style={{ maxHeight: '800px' }} />
        {image.caption && (
          <div className={cn(
            "p-2 text-center text-sm italic",
            theme === 'modern' && "text-slate-600 bg-slate-50/80 border-t border-slate-100",
            theme === 'vintage' && "text-[#4a3728] bg-[#f4f1ea] border-t-2 border-[#4a3728] font-serif",
            theme === 'prism' && "text-slate-600 bg-white/60 border-t border-white/40",
            theme === 'professional' && "text-slate-600 bg-slate-50 border-t border-slate-100"
          )}>
            {image.caption}
          </div>
        )}
      </div>
    </div>
  );
}

function ExtractedImagesZone({ children, active, theme = 'modern' }: { children: React.ReactNode, active: boolean, theme?: Theme }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'extracted-images-zone' });
  
  return (
    <div 
      ref={active ? setNodeRef : undefined} 
      className={cn(
        "mt-12 pt-8 border-t-2 border-dashed transition-colors",
        theme === 'modern' && (isOver ? 'border-blue-500 bg-blue-50/50 rounded-xl p-4' : 'border-slate-200'),
        theme === 'vintage' && (isOver ? 'border-[#4a3728] bg-[#4a3728]/5 p-4' : 'border-[#4a3728]/30'),
        theme === 'prism' && (isOver ? 'border-indigo-500 bg-indigo-500/5 rounded-2xl p-4' : 'border-white/40'),
        theme === 'professional' && (isOver ? 'border-slate-900 bg-slate-900/5 rounded-lg p-4' : 'border-slate-200')
      )}
    >
      {children}
    </div>
  );
}

const PRESET_COLORS = [
  { id: 'blue', name: 'Blue', hex: '#3b82f6' },
  { id: 'red', name: 'Red', hex: '#ef4444' },
  { id: 'green', name: 'Green', hex: '#22c55e' },
  { id: 'purple', name: 'Purple', hex: '#a855f7' },
  { id: 'orange', name: 'Orange', hex: '#f97316' },
  { id: 'pink', name: 'Pink', hex: '#ec4899' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6' },
  { id: 'indigo', name: 'Indigo', hex: '#6366f1' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e' },
  { id: 'lime', name: 'Lime', hex: '#84cc16' },
  { id: 'violet', name: 'Violet', hex: '#8b5cf6' },
  { id: 'fuchsia', name: 'Fuchsia', hex: '#d946ef' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308' },
  { id: 'sky', name: 'Sky', hex: '#0ea5e9' },
  { id: 'neon-green', name: 'Neon Green', hex: '#39FF14' },
  { id: 'electric-blue', name: 'Electric Blue', hex: '#7DF9FF' },
  { id: 'hot-pink', name: 'Hot Pink', hex: '#FF69B4' },
  { id: 'vivid-violet', name: 'Vivid Violet', hex: '#9F00FF' },
  { id: 'bright-yellow', name: 'Bright Yellow', hex: '#FFFF00' },
  { id: 'deep-sky-blue', name: 'Deep Sky Blue', hex: '#00BFFF' },
  { id: 'sunset-orange', name: 'Sunset Orange', hex: '#FD5E53' },
  { id: 'acid-green', name: 'Acid Green', hex: '#B0BF1A' },
  { id: 'radical-red', name: 'Radical Red', hex: '#FF355E' },
  { id: 'laser-lemon', name: 'Laser Lemon', hex: '#FFFF66' },
  { id: 'zinc', name: 'Zinc', hex: '#71717a' },
  { id: 'slate', name: 'Slate', hex: '#64748b' },
  { id: 'stone', name: 'Stone', hex: '#78716c' },
  { id: 'neutral', name: 'Neutral', hex: '#737373' },
  { id: 'brown', name: 'Brown', hex: '#92400e' },
  { id: 'maroon', name: 'Maroon', hex: '#991b1b' },
  { id: 'navy', name: 'Navy', hex: '#1e3a8a' },
  { id: 'olive', name: 'Olive', hex: '#3f6212' },
];


const DEFAULT_SAMPLE = `"Medicine 101","TITLE","Fundamentals of Clinical Medicine"
"Medicine 101","SUBHEADER","The Patient Encounter"
"Medicine 101","STEP","[Chief Complaint]{Chief Complaint|The primary issue|The main reason the patient seeks care|Always quoted}| -> [History of Present Illness]{HPI|Story of the illness|Detailed narrative of symptoms|Use OLDCARTS}| -> [Review of Systems]{ROS|Systematic inquiry|Questions about all body systems|Uncover hidden issues}| -> [Physical Exam]{Physical Exam|Objective findings|Inspection, Palpation, Percussion, Auscultation|The 'PE'}"
"Medicine 101","EXPLANATION","The [[History of Present Illness]] (HPI) is the cornerstone of diagnosis. Use the [OLDCARTS]{OLDCARTS|History-taking mnemonic|Onset, Location, Duration, Character, Aggravating, Relieving, Timing, Severity|Standard framework} mnemonic to structure your questions. For chest pain, you'd ask: 'Where exactly is the pain?' and 'Does it get worse when you take a deep breath?'"
"Medicine 101","AR_SIMPLIFY","الـ [[HPI]] دي ببساطة الحكاية الكاملة من أول ما الألم بدأ. زي لما تقول لصاحبك 'حكيني من الأول' بالظبط. بتستخدم [OLDCARTS]{OLDCARTS|التاريخ المرضي|ازاي تاخد التاريخ|أداة تذكر} عشان متنساش حاجة."
"Medicine 101","TIP","Always start with an open-ended question: 'What brought you in today?' rather than 'Do you have chest pain?' to avoid anchoring bias."
"Medicine 101","DEFINITION","[[Anchoring Bias]]: The tendency to latch onto the first piece of information and fail to adjust your diagnosis as new data emerges."
"Medicine 101","IMPORTANT","EXAM TIP: The 'OLDCARTS' framework is high-yield for any question regarding the HPI. You must memorize it."
"Medicine 01","DIVIDER",""
"Medicine 101","SUBHEADER","Vital Signs & Common Abbreviations"
"Medicine 101","BULLET","- BP: [[Blood Pressure]] (Systolic/Diastolic)"
"Medicine 101","BULLET","- HR: [[Heart Rate]] (Beats per minute, BPM)"
"Medicine 101","BULLET","- RR: [[Respiratory Rate]] (Breaths per minute)"
"Medicine 101","BULLET","- SpO₂: Oxygen Saturation (Target > 92% for most)"
"Medicine 101","AR_EXPLANATION","العلامات الحيوية دي هي 'العدادات' بتاعة الجسم. لو العداد وقع أو طلع أوي، ده معناه إن في مشكلة. زي الـ [[Blood Pressure]] لو نزل جداً، المريض ممكن يقع من قلة الدورة الدموية."
"Medicine 101","WARNING","Do NOT document a value as 'normal' without the number. 'BP normal' is subjective and unhelpful in a medico-legal context. Always record the specific value, e.g., BP 120/80."
"Medicine 101","CODE","Adult Normal Ranges:\nBP: <120/80 mmHg\nHR: 60-100 bpm\nRR: 12-20 breaths/min\nTemp: 36.1-37.2°C (97-99°F)\nSpO₂: 95-100%"
"Medicine 101","MNEMONIC","[[MUDPILES]]: Causes of high anion gap metabolic acidosis. Methanol, Uremia, DKA, Paraldehyde, Isoniazid/INH, Lactic acidosis, Ethylene glycol, Salicylates."
"Medicine 101","DIVIDER",""
"Medicine 101","SUBHEADER","Pharmacology Basics"
"Medicine 101","CONCEPT","[[Pharmacokinetics]] vs [[Pharmacodynamics]]"
"Medicine 101","TABLE_HEAD","Concept | Focus | Mnemonic"
"Medicine 101","TABLE_ROW","[[Pharmacokinetics]] | What the body does to the drug | ADME (Absorption, Distribution, Metabolism, Excretion)"
"Medicine 101","TABLE_ROW","[[Pharmacodynamics]] | What the drug does to the body | [c:blue]Receptor binding, effects[/c]"
"Medicine 101","AR_KEY_POINT","أهم حاجة تفرق بينهم: [[Pharmacokinetics]] بتاعت الجسم إزاي يتعامل مع الدواء (يدخله، يوزعه، يشيله)، و [[Pharmacodynamics]] بتاعة الدواء إزاي يأثر على الجسم. متخلطش بينهم!"
"Medicine 101","EXAMPLE","Scenario: A patient with kidney failure is given a drug that is normally excreted by the kidneys. The duration of action is prolonged. This is a change in [[Pharmacokinetics]] (specifically excretion). The drug still binds to its receptor the same way, so [[Pharmacodynamics]] is unchanged."
"Medicine 101","CALLOUT","Did you know? The 'First Pass Effect' refers to the metabolism of an oral drug by the liver before it reaches systemic circulation. This is why some drugs (e.g., [c:orange]Nitroglycerin[/c]) are given sublingually to bypass the liver."
"Medicine 101","IMPORTANT","EXAM TIP: [[Cytochrome P450]] (CYP450) system is the major enzyme family responsible for drug metabolism. Inhibitors (like grapefruit juice) increase drug levels; inducers (like rifampin) decrease drug levels."
"Medicine 101","DIVIDER",""
"Medicine 101","SUBHEADER","Key Medical Mnemonics"
"Medicine 101","MNEMONIC","[[ABCDEF]] for Primary Survey in Trauma:\n- A: Airway with Cervical Spine immobilization\n- B: Breathing\n- C: Circulation (with hemorrhage control)\n- D: Disability (Neurological status)\n- E: Exposure / Environmental control\n- F: Family / Full set of vitals"
"Medicine 101","EXPLANATION","The [[ABCDEF]] mnemonic is your first priority. You cannot move to 'B' if 'A' is not secured. If the patient is talking, the airway is patent. If not, you must immediately intervene (e.g., jaw thrust)."
"Medicine 101","QUOTE","'Treat the patient, not the monitor.' - A fundamental principle in clinical medicine. Do not rely solely on numbers; assess the clinical picture."
"Medicine 101","AR_EXAMPLE","تخيل مريجعة إتصدم في عربية. أول حاجة تشيك عليها بمنهجية [[ABCDEF]] مش عشوائي. الأول الطريق الهوا، بعدين النفس، بعدين الدورة الدموية، وهكذا. الترتيب مهم جداً عشان تنقذ حياته."
"Medicine 101","CHECKLIST","Criteria for [[Systemic Inflammatory Response Syndrome]] (SIRS) - Must have ≥2:\n☐ Temperature < 36°C or > 38°C\n☐ Heart Rate > 90 bpm\n☐ Respiratory Rate > 20 breaths/min or PaCO₂ < 32 mmHg\n☐ WBC < 4,000 or > 12,000 cells/mm³"
"Medicine 101","WARNING","[[Sepsis]] is a medical emergency. If SIRS criteria are met and there is a suspected source of infection, immediate management includes: [c:red]IV fluids, broad-spectrum antibiotics within 1 hour, and lactate measurement[/c]."
"Medicine 101","KEY_POINT","[[Hypersensitivity Reactions]] are classified into 4 types. Type I is anaphylaxis (IgE mediated). Type II is cytotoxic (e.g., hemolytic anemia). Type III is immune complex (e.g., serum sickness). Type IV is delayed (e.g., TB skin test, contact dermatitis)."
"Medicine 101","IMG_TEXT","Anaphylaxis pathophysiology"
"Medicine 101","DIVIDER",""
"Medicine 101","SUBHEADER","Quick Exam: Patient Encounter & Vital Signs"
"Medicine 101","MCQ","{""question"": ""A 55-year-old man presents with substernal chest pressure that radiates to his jaw. Using the OLDCARTS framework, which question would best assess the 'Aggravating' factor?"", ""options"": [""When did the pain start?"", ""Does the pain get worse when you walk up stairs?"", ""On a scale of 1-10, how bad is it?"", ""Does the pain go anywhere else?""], ""answer"": ""Does the pain get worse when you walk up stairs?"", ""explanation"": ""'Aggravating' factors ask what makes the pain worse. 'When did it start' is Onset. 'Scale of 1-10' is Severity. 'Does it go anywhere' is Radiation.""}"
"Medicine 101","MCQ","{""question"": ""A patient is found to have a heart rate of 110 bpm and a blood pressure of 100/70 mmHg. What is the correct way to document this in a medical record?"", ""options"": [""Vitals are slightly elevated."", ""BP and HR are abnormal."", ""BP 100/70, HR 110."", ""Patient is tachycardic and hypotensive.""], ""answer"": ""BP 100/70, HR 110."", ""explanation"": ""Always document the specific numerical values to ensure objective and legal accuracy. Descriptive terms like 'slightly elevated' are subjective and ambiguous.""}"
"Medicine 101","AR_KEY_POINT","الـ [[OLDCARTS]] دي أداة حلوة جداً عشان تاخد التاريخ بشكل كامل. افتكر إن 'الـ Location' بتاعة الألم أهم حاجة لو جالك وجع في الصدر، عشان نفرق بين القلب والمريء."
"Medicine 101","DIVIDER",""
"Medicine 101","SUBHEADER","Quick Exam: Pharmacology & Mnemonics"
"Medicine 101","MCQ","{""question"": ""A patient with liver cirrhosis is prescribed a medication that is extensively metabolized by the liver. What is the most likely change in the drug's pharmacokinetic profile?"", ""options"": [""Decreased absorption"", ""Increased bioavailability"", ""Decreased volume of distribution"", ""Increased renal excretion""], ""answer"": ""Increased bioavailability"", ""explanation"": ""Liver failure reduces first-pass metabolism and drug clearance, leading to increased bioavailability and a higher risk of toxicity. This is a pharmacokinetic change (what the body does to the drug).""}"
"Medicine 101","ESSAY","{""question"": ""Explain the difference between Type I and Type IV hypersensitivity reactions, providing a clinical example for each."", ""answer"": ""Type I is an immediate, IgE-mediated reaction causing anaphylaxis, while Type IV is a delayed, T-cell mediated reaction causing contact dermatitis."", ""explanation"": ""Type I (e.g., bee sting anaphylaxis) occurs within minutes and involves histamine. Type IV (e.g., poison ivy rash) takes 48-72 hours and involves T-lymphocytes and macrophages. This distinction is critical for diagnosis and treatment (epinephrine vs. topical steroids).""}"
"Medicine 101","AR_SIMPLIFY","بص، [[Hypersensitivity Reactions]] باختصار: النوع الأول (Type I) بيحصل بسرعة زي لما واحد يتلسع بنحلة ويتورم. النوع الرابع (Type IV) بياخد وقت، زي لما تلبس ساعة معدن ويتعب الجلد تحتها بعد يومين. الفرق في السرعة ونوع الخلايا المناعية."
"Medicine 101","SUMMARY","This section covered the foundational pillars of clinical medicine: structured patient history taking (OLDCARTS), objective documentation of vital signs, the critical distinction between pharmacokinetics and pharmacodynamics, and high-yield mnemonics for emergencies (ABCDEF) and disease classification (MUDPILES, SIRS, Hypersensitivity). Mastery of these core concepts is essential for safe and effective clinical practice."`;

export default function Parser() {
  const { 
    theme, 
    setTheme, 
    videoBackgroundEnabled, 
    setVideoBackgroundEnabled, 
    customVideoUrl, 
    setCustomVideoUrl,
    videoBackgroundBase64,
    setVideoBackgroundBase64,
    overlayVideos,
    addOverlayVideo,
    updateOverlayVideo,
    removeOverlayVideo
  } = useTheme();
  const [input, setInput] = useState(DEFAULT_SAMPLE);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<PlacedImage[]>([]);
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<string | null>('appearance');
  const [textSize, setTextSize] = useState(13); // Default 13px
  const [selectedColors, setSelectedColors] = useState<string[]>(['#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f97316', '#39FF14', '#FF69B4', '#00BFFF']); // Default cycle with vibrant colors
  const [uploadedFonts, setUploadedFonts] = useState<CustomFont[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>('Inter'); // Default
  const [pendingImage, setPendingImage] = useState<{ url: string, path: string | null } | null>(null);
  const [pendingImageSettings, setPendingImageSettings] = useState<PlacedImage>({
    url: '',
    width: 25,
    alignment: 'right',
    hasBorder: false,
    caption: ''
  });
  const [isGameThemeMenuOpen, setIsGameThemeMenuOpen] = useState(false);

  const gameThemes = [
    { id: 'minecraft', name: 'Minecraft', icon: Box, color: 'bg-green-700' },
    { id: 'undertale', name: 'Undertale', icon: Heart, color: 'bg-black' },
    { id: 'god-of-war', name: 'God of War', icon: Sword, color: 'bg-red-900' },
    { id: 'cuphead', name: 'Cuphead', icon: Ghost, color: 'bg-amber-600' }
  ];

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB for base64 storage)
    if (file.size > 10 * 1024 * 1024) {
      alert("Video file is too large. Please use a video under 10MB or use a URL.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setVideoBackgroundBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleOverlayVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, id?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB for base64 storage)
    if (file.size > 10 * 1024 * 1024) {
      alert("Video file is too large. Please use a video under 10MB or use a URL.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (id) {
        updateOverlayVideo(id, { base64, url: '' });
      } else {
        addOverlayVideo({ base64, url: '', enabled: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const mainThemes = [
    { id: 'modern', name: 'Modern', icon: Layout, color: 'bg-blue-500' },
    { id: 'cyberpunk', name: 'Cyber', icon: Sparkles, color: 'bg-purple-600' },
    { id: 'vintage', name: 'Vintage', icon: ClipboardList, color: 'bg-amber-700' },
    { id: 'terminal', name: 'Terminal', icon: Terminal, color: 'bg-green-600' },
    { id: 'ethereal', name: 'Ethereal', icon: Cloud, color: 'bg-indigo-400' },
    { id: 'prism', name: 'Prism', icon: Maximize2, color: 'bg-indigo-600' },
    { id: 'comic', name: 'Comic', icon: Zap, color: 'bg-yellow-400' }
  ];
  
  // Drag and Drop State
  const [isDragModeActive, setIsDragModeActive] = useState(false);
  const [imagePlacements, setImagePlacements] = useState<Record<string, PlacedImage[]>>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragUrl, setActiveDragUrl] = useState<string | null>(null);
  const [activeZonePath, setActiveZonePath] = useState<string | null>(null);
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptFormat, setPromptFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [selectedPromptTypes, setSelectedPromptTypes] = useState<string[]>(['TITLE', 'SUBHEADER', 'BULLET', 'EXPLANATION', 'WARNING', 'TIP', 'IMPORTANT', 'DEFINITION', 'MCQ', 'ESSAY']);
  const [reorderGroupIndex, setReorderGroupIndex] = useState<number | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [noteName, setNoteName] = useState('');
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const generateParam = searchParams.get('generate');

  const handleUniversalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const data = await parsePdf(file);
        setParsedData(data);
      } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
        const text = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const scriptTag = doc.getElementById('arcane-notes-metadata');
        
        let metadata: any = null;
        if (scriptTag) {
          try {
            metadata = JSON.parse(scriptTag.textContent || '');
          } catch (e) {
            console.warn('Failed to parse metadata from script tag', e);
          }
        }
        
        if (!metadata) {
          const startMarker = '<!-- ARCANE_NOTES_METADATA_START';
          const endMarker = 'ARCANE_NOTES_METADATA_END -->';
          const startIndex = text.indexOf(startMarker);
          const endIndex = text.indexOf(endMarker);
          if (startIndex !== -1 && endIndex !== -1) {
            const jsonStr = text.substring(startIndex + startMarker.length, endIndex).trim();
            try {
              metadata = JSON.parse(jsonStr);
            } catch (e) {
              console.warn('Failed to parse metadata from comment', e);
            }
          }
        }

        if (metadata) {
          handleHtmlMetadataExtracted(metadata);
        } else {
          throw new Error('No Arcane Notes metadata found in this HTML file.');
        }
      } else {
        throw new Error('Please upload a valid PDF or HTML file.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to process file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleGenerate = () => {
    setError(null);
    setIsGenerating(true);
    
    // Helper to repair simple JSON errors
    const repairJSON = (str: string) => {
      return str
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/}\s*{/g, '}, {')    // Add missing commas between objects
        .replace(/]\s*\[/g, '], [')    // Add missing commas between arrays
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Quote unquoted keys
    };

    // Helper to extract objects one by one if the whole JSON fails
    const attemptManualExtraction = (str: string) => {
      const results: any[] = [];
      let braceCount = 0;
      let start = -1;
      
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') {
          if (braceCount === 0) start = i;
          braceCount++;
        } else if (str[i] === '}') {
          braceCount--;
          if (braceCount === 0 && start !== -1) {
            const candidate = str.substring(start, i + 1);
            try {
              results.push(JSON.parse(candidate));
            } catch (e) {
              try {
                results.push(JSON.parse(repairJSON(candidate)));
              } catch (e2) {
                console.error("Failed to parse extracted block:", candidate);
              }
            }
          }
        }
      }
      return results;
    };

    setTimeout(() => {
      try {
        const trimmed = input.trim();
        if (!trimmed) {
          throw new Error("Please enter some JSON or CSV text.");
        }

        let rawItems: any[] = [];
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          // Try JSON
          try {
            const data = JSON.parse(trimmed);
            if (Array.isArray(data)) {
              rawItems = data;
            } else {
              setParsedData(data);
              return;
            }
          } catch (e: any) {
            // JSON failed, try repair or extraction
            console.warn("JSON parse failed, attempting repair...", e);
            const repaired = repairJSON(trimmed);
            try {
              const data = JSON.parse(repaired);
              if (Array.isArray(data)) {
                rawItems = data;
              } else {
                setParsedData(data);
                return;
              }
            } catch (e2) {
              // Still failed, try to extract objects one by one
              rawItems = attemptManualExtraction(trimmed);
              if (rawItems.length === 0) {
                throw new Error(`JSON Error: ${e.message}. Please check your format.`);
              }
            }
          }
        } else {
          // Try CSV
          const result = Papa.parse(trimmed, { header: false, skipEmptyLines: true });
          if (result.errors.length > 0 && result.data.length === 0) {
            throw new Error("Invalid CSV format.");
          }
          
          const parsedArray = result.data as string[][];
          
          // Check if it looks like GROUP, TYPE, CONTENT
          const isGroupTypeContentFormat = parsedArray.length > 0 && parsedArray.some(row => row.length >= 3 && /^[A-Z_]+$/.test(row[1]?.trim() || ''));
          const isTypeContentFormat = parsedArray.length > 0 && parsedArray.some(row => row.length >= 2 && /^[A-Z_]+$/.test(row[0]?.trim() || ''));
          
          if (isGroupTypeContentFormat) {
            rawItems = parsedArray.map(row => {
              if (!row[0] || !row[1]) return null;
              if (row[0].trim() === 'GROUP' && row[1].trim() === 'TYPE') return null;
              return {
                GROUP: row[0].trim(),
                TYPE: row[1].trim(),
                CONTENT: row.slice(2).join(',').trim()
              };
            }).filter(Boolean);
          } else if (isTypeContentFormat) {
            rawItems = parsedArray.map(row => {
              if (!row[0]) return null;
              if (row[0].trim() === 'TYPE' && row[1]?.trim() === 'CONTENT') return null;
              return {
                TYPE: row[0].trim(),
                CONTENT: row.slice(1).join(',').trim()
              };
            }).filter(Boolean);
          } else {
            // Assume first row is header
            const headers = parsedArray[0];
            if (!headers) throw new Error("Invalid CSV format: missing headers.");
            rawItems = parsedArray.slice(1).map(row => {
              if (!row || row.length === 0 || (row.length === 1 && !row[0])) return null;
              const obj: any = {};
              headers.forEach((h, i) => {
                if (h) obj[h] = row[i];
              });
              return obj;
            }).filter(Boolean);
          }
        }

        // Grouping logic
        if (rawItems.length > 0 && rawItems.some(item => item && typeof item === 'object' && item.TYPE)) {
          const groupsMap = new Map<string, any[]>();
          rawItems.forEach((item, idx) => {
            if (!item || typeof item !== 'object') return; // Skip invalid items
            const groupName = item.GROUP || 'Default Topic';
            if (!groupsMap.has(groupName)) {
              groupsMap.set(groupName, []);
            }
            groupsMap.get(groupName)!.push({ ...item, id: `item-${Date.now()}-${idx}` });
          });
          
          const groupedData = Array.from(groupsMap.entries()).map(([groupName, items], idx) => ({
            id: `group-${Date.now()}-${idx}`,
            GROUP: groupName,
            ITEMS: items
          }));
          
          setParsedData(groupedData);
        } else {
          setParsedData(rawItems);
        }
      } catch (err: any) {
        setError(err.message || "Failed to parse input. Ensure it's valid JSON or CSV.");
        setParsedData(null);
      } finally {
        setIsGenerating(false);
      }
    }, 400); // Fake delay for smooth animation
  };

  // Local Storage Persistence
  useEffect(() => {
    const savedInput = localStorage.getItem('arcane-notes-input');
    const savedExtractedImages = localStorage.getItem('arcane-notes-extracted-images');
    const savedImagePlacements = localStorage.getItem('arcane-notes-image-placements');
    const savedTextSize = localStorage.getItem('arcane-notes-text-size');
    const savedSelectedColors = localStorage.getItem('arcane-notes-selected-colors');
    const savedPromptFormat = localStorage.getItem('arcane-notes-prompt-format');
    const savedPromptTypes = localStorage.getItem('arcane-notes-prompt-types');
    const savedUploadedFonts = localStorage.getItem('arcane-notes-uploaded-fonts');
    const savedSelectedFont = localStorage.getItem('arcane-notes-selected-font');
    const savedTheme = localStorage.getItem('arcane-notes-theme');
    const savedCurrentNoteId = localStorage.getItem('arcane-notes-current-note-id');

    if (savedInput) setInput(savedInput);
    if (savedExtractedImages) {
      const parsed = JSON.parse(savedExtractedImages);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        setExtractedImages(parsed.map((url: string) => ({ url, alignment: 'center' as const, size: 'medium' as const, hasBorder: false })));
      } else {
        setExtractedImages(parsed);
      }
    }
    if (savedImagePlacements) setImagePlacements(JSON.parse(savedImagePlacements));
    if (savedTextSize) setTextSize(parseInt(savedTextSize, 10));
    if (savedSelectedColors) setSelectedColors(JSON.parse(savedSelectedColors));
    if (savedPromptFormat) setPromptFormat(savedPromptFormat as 'CSV' | 'JSON');
    if (savedPromptTypes) setSelectedPromptTypes(JSON.parse(savedPromptTypes));
    if (savedUploadedFonts) setUploadedFonts(JSON.parse(savedUploadedFonts));
    if (savedSelectedFont) setSelectedFont(savedSelectedFont);
    if (savedTheme) setTheme(savedTheme as any);

    if (noteId) {
      const savedNotes = JSON.parse(localStorage.getItem('arcane_saved_notes') || '[]');
      const note = savedNotes.find((n: any) => n.id === noteId);
      if (note) {
        setParsedData(note.parsedData);
        setImagePlacements(note.imagePlacements || {});
        if (note.settings) {
          if (note.settings.theme) setTheme(note.settings.theme);
          if (note.settings.selectedColors) setSelectedColors(note.settings.selectedColors);
          if (note.settings.textSize) setTextSize(note.settings.textSize);
          if (note.settings.selectedFont) setSelectedFont(note.settings.selectedFont);
        }
        localStorage.setItem('arcane-notes-current-note-id', noteId);
      }
    } else {
      localStorage.removeItem('arcane-notes-current-note-id');
    }
  }, [noteId]);

  useEffect(() => {
    try {
      if (input !== undefined) {
        localStorage.setItem('arcane-notes-input', input);
      }
    } catch (e) {
      console.warn('LocalStorage quota exceeded for input');
    }
  }, [input]);

  useEffect(() => {
    try {
      if (parsedData !== null) {
        localStorage.setItem('arcane-notes-parsed-data', JSON.stringify(parsedData));
        
        // Also update the saved note if we have a noteId
        if (noteId) {
          const savedNotes = JSON.parse(localStorage.getItem('arcane_saved_notes') || '[]');
          const noteIndex = savedNotes.findIndex((n: any) => n.id === noteId);
          if (noteIndex !== -1) {
            savedNotes[noteIndex].parsedData = parsedData;
            localStorage.setItem('arcane_saved_notes', JSON.stringify(savedNotes));
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage quota exceeded for parsed-data');
    }
  }, [parsedData, noteId]);

  useEffect(() => {
    try {
      if (extractedImages !== undefined) {
        localStorage.setItem('arcane-notes-extracted-images', JSON.stringify(extractedImages));
      }
    } catch (e) {
      console.warn('LocalStorage quota exceeded for extracted-images');
    }
  }, [extractedImages]);

  useEffect(() => {
    try {
      if (imagePlacements !== undefined) {
        localStorage.setItem('arcane-notes-image-placements', JSON.stringify(imagePlacements));
        
        // Also update the saved note if we have a noteId
        if (noteId) {
          const savedNotes = JSON.parse(localStorage.getItem('arcane_saved_notes') || '[]');
          const noteIndex = savedNotes.findIndex((n: any) => n.id === noteId);
          if (noteIndex !== -1) {
            savedNotes[noteIndex].imagePlacements = imagePlacements;
            localStorage.setItem('arcane_saved_notes', JSON.stringify(savedNotes));
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage quota exceeded for image-placements');
    }
  }, [imagePlacements, noteId]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-text-size', textSize.toString());
    } catch (e) {
      console.warn('LocalStorage quota exceeded for text-size');
    }
  }, [textSize]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-selected-colors', JSON.stringify(selectedColors));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for selected-colors');
    }
  }, [selectedColors]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-prompt-format', promptFormat);
    } catch (e) {
      console.warn('LocalStorage quota exceeded for prompt-format');
    }
  }, [promptFormat]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-prompt-types', JSON.stringify(selectedPromptTypes));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for prompt-types');
    }
  }, [selectedPromptTypes]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-uploaded-fonts', JSON.stringify(uploadedFonts));
    } catch (e) {
      console.warn('LocalStorage quota exceeded for uploaded-fonts');
    }
  }, [uploadedFonts]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-selected-font', selectedFont);
    } catch (e) {
      console.warn('LocalStorage quota exceeded for selected-font');
    }
  }, [selectedFont]);

  useEffect(() => {
    try {
      localStorage.setItem('arcane-notes-theme', theme);
    } catch (e) {
      console.warn('LocalStorage quota exceeded for theme');
    }
  }, [theme]);

  useEffect(() => {
    const font = uploadedFonts.find(f => f.name === selectedFont);
    const styleId = 'custom-font-style';
    let style = document.getElementById(styleId);
    
    if (font) {
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.innerHTML = `
        @font-face {
          font-family: '${font.name}';
          src: url('${font.data}');
        }
        .document-preview {
          font-family: '${font.name}', sans-serif !important;
        }
      `;
    } else {
      if (style) style.innerHTML = '';
      // Reset to default Inter if font not found
      const previewEl = document.querySelector('.document-preview');
      if (previewEl) (previewEl as HTMLElement).style.fontFamily = '';
    }
  }, [selectedFont, uploadedFonts]);

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Limit max dimension to 1600px
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, path: string | null = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawUrl = event.target?.result as string;
      const url = await compressImage(rawUrl);
      
      const targetPath = path || activeZonePath;
      const targetItem = targetPath ? getItemByPath(targetPath) : null;
      const isImgBlock = targetItem && targetItem.TYPE === 'IMG';

      setPendingImage({ url, path: targetPath });
      setPendingImageSettings({
        url,
        width: isImgBlock ? 100 : (targetPath ? 25 : 100),
        alignment: isImgBlock ? 'center' : (targetPath ? 'right' : 'center'),
        hasBorder: false,
        caption: ''
      });
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPendingImage = () => {
    if (!pendingImage) return;

    const { path } = pendingImage;
    const settings = pendingImageSettings;

    if (path) {
      // Check if path is an IMG type block
      const targetItem = getItemByPath(path);
      if (targetItem && targetItem.TYPE === 'IMG') {
        handleUpdateItem(path, { CONTENT: settings.url });
      } else {
        setImagePlacements(prev => ({
          ...prev,
          [path]: [...(prev[path] || []), settings]
        }));
      }
      // Remove from extracted images if it was there
      setExtractedImages(prev => prev.filter(img => img.url !== settings.url));
      setActiveZonePath(null);
    } else {
      setExtractedImages(prev => [...prev, settings]);
    }
    setPendingImage(null);
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      const newFont: CustomFont = {
        name: fontName,
        data: data,
        fileName: file.name
      };
      setUploadedFonts(prev => [...prev, newFont]);
      setSelectedFont(fontName);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFont = (fontName: string) => {
    setUploadedFonts(prev => prev.filter(f => f.name !== fontName));
    if (selectedFont === fontName) {
      setSelectedFont('Inter');
    }
  };

  const handleCopyPrompt = async () => {
    const selectedTypesList = AVAILABLE_TYPES.filter(t => selectedPromptTypes.includes(t.id))
      .map(t => `- **${t.id}**: ${t.description}\n  - *When to use*: ${t.whenToUse}\n  - *When NOT to use*: ${t.whenNotToUse}`)
      .join('\n\n');

    const formatInstructions = promptFormat === 'CSV' 
      ? `### CSV Format Rules:
1. **No Headers**: Do not include a header row.
2. **Columns**: The CSV must have exactly 3 columns: \`GROUP\`, \`TYPE\`, \`CONTENT\`.
3. **Escaping**: If the \`CONTENT\` contains a comma (\`,\`), you MUST wrap the entire content in double quotes (\`"\`).
4. **Delimiter**: Use a standard comma (\`,\`) as the delimiter.`
      : `### JSON Format Rules:
1. **Structure**: Provide a valid JSON array of objects.
2. **Keys**: Each object must have exactly three keys: \`"GROUP"\`, \`"TYPE"\`, and \`"CONTENT"\`.
3. **Escaping**: Ensure all special characters are properly escaped for valid JSON.`;

    const generateExample = (type: string, format: 'CSV' | 'JSON') => {
      const examples: Record<string, { csv: string, json: string }> = {
        TITLE: { csv: `"Biology 101", "TITLE", "CELLULAR BIOLOGY"`, json: `{ "GROUP": "Biology 101", "TYPE": "TITLE", "CONTENT": "CELLULAR BIOLOGY" }` },
        SUBHEADER: { csv: `"Biology 101", "SUBHEADER", "Structure"`, json: `{ "GROUP": "Biology 101", "TYPE": "SUBHEADER", "CONTENT": "Structure" }` },
        DEFINITION: { csv: `"Biology 101", "DEFINITION", "[[Mitochondria]]: Powerhouse of the cell"`, json: `{ "GROUP": "Biology 101", "TYPE": "DEFINITION", "CONTENT": "[[Mitochondria]]: Powerhouse of the cell" }` },
        TIP: { csv: `"Biology 101", "TIP", "Remember that RBCs lack [[Mitochondria]]."`, json: `{ "GROUP": "Biology 101", "TYPE": "TIP", "CONTENT": "Remember that RBCs lack [[Mitochondria]]." }` },
        IMPORTANT: { csv: `"Biology 101", "IMPORTANT", "EXAM TIP: [c:red]Ribosomes[/c] are the site of protein synthesis."`, json: `{ "GROUP": "Biology 101", "TYPE": "IMPORTANT", "CONTENT": "EXAM TIP: [c:red]Ribosomes[/c] are the site of protein synthesis." }` },
        BULLET: { csv: `"Biology 101", "BULLET", "Size: 0.5 - 1.0 micrometers"`, json: `{ "GROUP": "Biology 101", "TYPE": "BULLET", "CONTENT": "Size: 0.5 - 1.0 micrometers" }` },
        EXPLANATION: { csv: `"Biology 101", "EXPLANATION", "The cell membrane is a [lipid bilayer]{Lipid Bilayer|Double layer of lipids|Two layers of fat molecules|Protects the cell}"`, json: `{ "GROUP": "Biology 101", "TYPE": "EXPLANATION", "CONTENT": "The cell membrane is a [lipid bilayer]{Lipid Bilayer|Double layer of lipids|Two layers of fat molecules|Protects the cell}" }` },
        MCQ: { csv: `"Biology 101", "MCQ", "{""question"": ""What is the powerhouse of the cell?"", ""options"": [""Nucleus"", ""Mitochondria"", ""Ribosome"", ""Golgi""], ""answer"": ""Mitochondria"", ""explanation"": ""[[Mitochondria]] generate most of the cell's supply of ATP.""}"`, json: `{ "GROUP": "Biology 101", "TYPE": "MCQ", "CONTENT": "{\\"question\\": \\"What is the powerhouse of the cell?\\", \\"options\\": [\\"Nucleus\\", \\"Mitochondria\\", \\"Ribosome\\", \\"Golgi\\"], \\"answer\\": \\"Mitochondria\\", \\"explanation\\": \\"[[Mitochondria]] generate most of the cell's supply of ATP.\\"}" }` },
        ESSAY: { csv: `"Biology 101", "ESSAY", "{""question"": ""Explain the function of the Golgi apparatus."", ""answer"": ""It modifies, sorts, and packages proteins."", ""explanation"": ""The Golgi apparatus acts like a post office for the cell.""}"`, json: `{ "GROUP": "Biology 101", "TYPE": "ESSAY", "CONTENT": "{\\"question\\": \\"Explain the function of the Golgi apparatus.\\", \\"answer\\": \\"It modifies, sorts, and packages proteins.\\", \\"explanation\\": \\"The Golgi apparatus acts like a post office for the cell.\\"}" }` },
        AR_EXPLANATION: { csv: `"Biology 101", "AR_EXPLANATION", "الـ [[Mitochondria]] دي تعتبر محطة توليد الكهرباء جوه الخلية."`, json: `{ "GROUP": "Biology 101", "TYPE": "AR_EXPLANATION", "CONTENT": "الـ [[Mitochondria]] دي تعتبر محطة توليد الكهرباء جوه الخلية." }` },
        AR_SIMPLIFY: { csv: `"Biology 101", "AR_SIMPLIFY", "ببساطة، الـ Ribosomes هي المصنع اللي بيعمل البروتين."`, json: `{ "GROUP": "Biology 101", "TYPE": "AR_SIMPLIFY", "CONTENT": "ببساطة، الـ Ribosomes هي المصنع اللي بيعمل البروتين." }` },
        AR_DEFINITION: { csv: `"Biology 101", "AR_DEFINITION", "الـ Nucleus: هي مركز التحكم في الخلية."`, json: `{ "GROUP": "Biology 101", "TYPE": "AR_DEFINITION", "CONTENT": "الـ Nucleus: هي مركز التحكم في الخلية." }` },
        AR_KEY_POINT: { csv: `"Biology 101", "AR_KEY_POINT", "أهم حاجة تفتكرها إن الـ Cell Membrane بيتحكم في إيه اللي يدخل ويخرج."`, json: `{ "GROUP": "Biology 101", "TYPE": "AR_KEY_POINT", "CONTENT": "أهم حاجة تفتكرها إن الـ Cell Membrane بيتحكم في إيه اللي يدخل ويخرج." }` },
        AR_EXAMPLE: { csv: `"Biology 101", "AR_EXAMPLE", "زي مثلاً لما الـ White Blood Cells تهاجم البكتيريا."`, json: `{ "GROUP": "Biology 101", "TYPE": "AR_EXAMPLE", "CONTENT": "زي مثلاً لما الـ White Blood Cells تهاجم البكتيريا." }` },
        WARNING: { csv: `"Biology 101", "WARNING", "Do not confuse [[Mitochondria]] with [[Chloroplasts]]."`, json: `{ "GROUP": "Biology 101", "TYPE": "WARNING", "CONTENT": "Do not confuse [[Mitochondria]] with [[Chloroplasts]]." }` },
        CONCEPT: { csv: `"Biology 101", "CONCEPT", "The Cell Theory"`, json: `{ "GROUP": "Biology 101", "TYPE": "CONCEPT", "CONTENT": "The Cell Theory" }` },
        MNEMONIC: { csv: `"Biology 101", "MNEMONIC", "PMAT: Prophase, Metaphase, Anaphase, Telophase"`, json: `{ "GROUP": "Biology 101", "TYPE": "MNEMONIC", "CONTENT": "PMAT: Prophase, Metaphase, Anaphase, Telophase" }` },
        KEY_POINT: { csv: `"Biology 101", "KEY_POINT", "Cells are the basic unit of life."`, json: `{ "GROUP": "Biology 101", "TYPE": "KEY_POINT", "CONTENT": "Cells are the basic unit of life." }` },
      };
      
      // Fallback for types without specific examples
      if (!examples[type]) {
        return format === 'CSV' 
          ? `"Biology 101", "${type}", "Example content for ${type}"`
          : `{ "GROUP": "Biology 101", "TYPE": "${type}", "CONTENT": "Example content for ${type}" }`;
      }
      return format === 'CSV' ? examples[type].csv : examples[type].json;
    };

    const exampleLines = selectedPromptTypes.map(type => generateExample(type, promptFormat));
    
    const exampleOutput = promptFormat === 'CSV'
      ? `### Example CSV Output:\n${exampleLines.join('\n')}`
      : `### Example JSON Output:\n[\n  ${exampleLines.join(',\n  ')}\n]`;

    const hasExams = selectedPromptTypes.includes('MCQ') || selectedPromptTypes.includes('ESSAY');
    const hasAR = selectedPromptTypes.some(t => t.startsWith('AR_'));

    const examInstructions = hasExams ? `
### Exam Instructions (MCQ & ESSAY):
- You MUST include MCQ and/or ESSAY types at the end of EACH GROUP.
- Treat these as a "quick exam" to test the user's understanding of the material just covered in that specific group.
- Ensure the questions directly relate to the content provided in the preceding items of the same group.` : '';

    const arInstructions = hasAR ? `
### Special Instructions for Arabic (AR_) Types:
- Use the **Egyptian dialect (مصري)** as if a friendly teacher is explaining to a student.
- **CRITICAL**: Keep all medical terms, scientific names, and technical jargon in **English**.
- Example: "الـ [[Mitochondria]] هي الـ powerhouse بتاعة الـ cell."
- **STRATEGIC PLACEMENT**: You MUST insert an AR_ type after every 1 or 2 standard types (maximum 3).
- The AR_ type should explain, simplify, or give an example of what was just written in the preceding 1 or 2 types, acting as a friendly recap.` : '';

    const prompt = `## Role: Expert Educational Content Architect
## Task: Generate high-quality, structured data for a document rendering engine.

### General Instructions:
1. **Strict Output**: Output ONLY the raw ${promptFormat} data. 
2. **No Metadata**: Do NOT include markdown code blocks (\`\`\`json or \`\`\`csv), greetings, or explanations.
3. **Grouping**: The \`GROUP\` field represents the topic. Items with the same GROUP will be styled together as a cohesive unit.
4. **Markdown Support (MANDATORY)**: You MUST use markdown formatting within the \`CONTENT\` to make it readable and engaging:
   - **Bold** or *Italics* (These will be dynamically colored based on the group's theme).
   - \`Inline Code\` for technical terms.
   - ==Highlighted Text== for emphasis.
5. **Custom Syntax (MANDATORY)**: You MUST use the following syntax to create an interactive learning experience:
   - **Interactive Popovers**: Use \`[Term to click]{Title|Definition|Simple explanation|Extra info}\`. Use this frequently for complex terms.
   - **Memory Links**: Use \`[[Concept Name]]\` to link concepts across the entire document. Every major concept MUST be linked.
   - **Custom Colors**: Use \`[c:hex_or_name]text[/c]\` (e.g., \`[c:red]Important[/c]\`).

${formatInstructions}
${examInstructions}
${arInstructions}

### Allowed TYPEs and their usage:
You MUST strictly follow the guidelines on when to use and when NOT to use each type. Do NOT use any types not listed here.

${selectedTypesList}

${exampleOutput}

### Content to Process:
Please generate a comprehensive set of items for the following topic:
[INSERT YOUR TOPIC OR PASTE YOUR NOTES HERE]`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(prompt);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      // Fallback for iframes or when document is not focused
      const textArea = document.createElement("textarea");
      textArea.value = prompt;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error('Fallback copy failed', e);
      }
      document.body.removeChild(textArea);
    }

    setIsPromptCopied(true);
    setTimeout(() => {
      setIsPromptCopied(false);
      setIsPromptModalOpen(false);
    }, 1500);
  };

  const togglePromptType = (id: string) => {
    setSelectedPromptTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleRemovePlacedImage = (path: string, index: number) => {
    setImagePlacements(prev => {
      const newPlacements = { ...prev };
      const removedImage = newPlacements[path][index];
      if (removedImage) {
        setExtractedImages(imgs => [...imgs, removedImage]);
      }
      newPlacements[path] = newPlacements[path].filter((_, idx) => idx !== index);
      return newPlacements;
    });
  };

  const getItemByPath = (path: string) => {
    if (!parsedData) return null;
    const parts = path.split('.');
    let current = parsedData;
    const startIndex = parts[0] === 'root' ? 1 : 0;
    
    for (let i = startIndex; i < parts.length; i++) {
      const part = parts[i];
      if (current === null || current === undefined || current[part] === undefined) return null;
      current = current[part];
    }
    return current;
  };

  const handleUpdateItem = (path: string, updates: any) => {
    setParsedData((prev: any) => {
      if (!prev) return prev;
      const newData = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      
      if (parts.length === 1 && parts[0] === 'root') {
        return { ...newData, ...updates };
      }

      let current = newData;
      const startIndex = parts[0] === 'root' ? 1 : 0;
      
      for (let i = startIndex; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined) return prev;
        current = current[part];
      }
      
      const lastPart = parts[parts.length - 1];
      if (current[lastPart] !== undefined) {
        current[lastPart] = { ...current[lastPart], ...updates };
      }
      
      return newData;
    });
  };

  const handleUpdatePlacedImage = (path: string, index: number, updates: Partial<PlacedImage>) => {
    setImagePlacements(prev => {
      const newPlacements = { ...prev };
      if (newPlacements[path] && newPlacements[path][index]) {
        newPlacements[path] = [...newPlacements[path]];
        newPlacements[path][index] = { ...newPlacements[path][index], ...updates };
      }
      return newPlacements;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
    setActiveDragUrl(event.active.data.current?.url || null);
  };

  const handleDragEnd = (event: any) => {
    setActiveDragId(null);
    setActiveDragUrl(null);
    const { active, over } = event;
    
    if (!over) return;

    if (active.data.current?.type === 'document-item') {
      const sourceGroupIndex = active.data.current.groupIndex;
      const sourceItemIndex = active.data.current.itemIndex;
      const targetGroupIndex = over.data.current?.groupIndex;
      
      if (targetGroupIndex !== undefined && sourceGroupIndex !== undefined) {
        setParsedData(prev => {
          if (!prev || !Array.isArray(prev)) return prev;
          const newData = [...prev];
          const sourceGroup = { ...newData[sourceGroupIndex], ITEMS: [...newData[sourceGroupIndex].ITEMS] };
          const targetGroup = sourceGroupIndex === targetGroupIndex ? sourceGroup : { ...newData[targetGroupIndex], ITEMS: [...newData[targetGroupIndex].ITEMS] };
          
          const [item] = sourceGroup.ITEMS.splice(sourceItemIndex, 1);
          const targetItemIndex = over.data.current?.itemIndex;
          
          if (sourceGroupIndex === targetGroupIndex) {
            if (targetItemIndex !== undefined) {
              sourceGroup.ITEMS.splice(targetItemIndex, 0, item);
            } else {
              sourceGroup.ITEMS.push(item);
            }
            newData[sourceGroupIndex] = sourceGroup;
          } else {
            item.GROUP = targetGroup.GROUP;
            if (targetItemIndex !== undefined) {
              targetGroup.ITEMS.splice(targetItemIndex, 0, item);
            } else {
              targetGroup.ITEMS.push(item);
            }
            newData[sourceGroupIndex] = sourceGroup;
            newData[targetGroupIndex] = targetGroup;
          }
          
          return newData;
        });
      }
      return;
    }

    const imageUrl = active.data.current?.url;
    let dropPath = over.id as string;
    
    // Handle brick- prefixed IDs from ordering mode
    if (dropPath.startsWith('brick-')) {
      const brickId = dropPath.replace('brick-', '');
      dropPath = brickId;
    }

    const source = active.data.current?.source;
    const sourcePath = active.data.current?.sourcePath;
    const sourceIndex = active.data.current?.sourceIndex;
    
    if (imageUrl && dropPath) {
        if (dropPath === 'extracted-images-zone') {
          if (source === 'placed' && sourcePath) {
            // Remove from placements
            setImagePlacements(prev => {
              const newPlacements = { ...prev };
              if (newPlacements[sourcePath]) {
                newPlacements[sourcePath] = newPlacements[sourcePath].filter((_, idx) => idx !== sourceIndex);
              }
              return newPlacements;
            });
            // Add back to extracted images
            setExtractedImages(prev => [...prev, { url: imageUrl, alignment: 'center' as const, size: 'medium' as const, hasBorder: false }]);
          }
          return;
        }

        // Check if dropping onto an IMG type block
        const targetItem = getItemByPath(dropPath);
        if (targetItem && targetItem.TYPE === 'IMG') {
          handleUpdateItem(dropPath, { CONTENT: imageUrl });
          if (source === 'extracted') {
            setExtractedImages(prev => prev.filter(img => img.url !== imageUrl));
          } else if (source === 'placed' && sourcePath) {
            setImagePlacements(prev => {
              const newPlacements = { ...prev };
              if (newPlacements[sourcePath]) {
                newPlacements[sourcePath] = newPlacements[sourcePath].filter((_, idx) => idx !== sourceIndex);
              }
              return newPlacements;
            });
          }
          return;
        }

        setImagePlacements(prev => {
          const newPlacements = { ...prev };
          let imageToPlace: PlacedImage = { url: imageUrl, width: 25, alignment: 'right' };
          
          // Remove from source if it was a placed image
          if (source === 'placed' && sourcePath) {
            if (newPlacements[sourcePath]) {
              const existingImage = newPlacements[sourcePath][sourceIndex];
              if (existingImage) {
                imageToPlace = { ...existingImage };
              }
              newPlacements[sourcePath] = newPlacements[sourcePath].filter((_, idx) => idx !== sourceIndex);
            }
          }
          
          // Add to new destination
          newPlacements[dropPath] = [...(newPlacements[dropPath] || []), imageToPlace];
          
          return newPlacements;
        });
        
        // Remove from extracted images if it came from there
        if (source === 'extracted') {
          setExtractedImages(prev => prev.filter(img => img.url !== imageUrl));
        }
      }
  };

  const handleSaveNote = () => {
    if (!noteName.trim() || !parsedData) return;
    
    const savedNotes = JSON.parse(localStorage.getItem('arcane_saved_notes') || '[]');
    
    if (noteId) {
      // Update existing note
      const noteIndex = savedNotes.findIndex((n: any) => n.id === noteId);
      if (noteIndex !== -1) {
        savedNotes[noteIndex] = {
          ...savedNotes[noteIndex],
          name: noteName.trim(),
          date: Date.now(),
          parsedData,
          imagePlacements,
          settings: { theme, selectedColors, textSize, selectedFont }
        };
        localStorage.setItem('arcane_saved_notes', JSON.stringify(savedNotes));
        setIsSaveModalOpen(false);
        setNoteName('');
        alert('Note updated successfully!');
        return;
      }
    }

    // Create new note
    const newNote = {
      id: Date.now().toString(),
      name: noteName.trim(),
      date: Date.now(),
      parsedData,
      imagePlacements,
      settings: { theme, selectedColors, textSize, selectedFont }
    };
    
    try {
      localStorage.setItem('arcane_saved_notes', JSON.stringify([...savedNotes, newNote]));
      setIsSaveModalOpen(false);
      setNoteName('');
      alert('Note saved successfully!');
    } catch (e) {
      console.error('Failed to save note', e);
      alert('Failed to save note. Storage might be full.');
    }
  };

  const handleHtmlMetadataExtracted = (metadata: any) => {
    if (metadata.parsedData) setParsedData(metadata.parsedData);
    if (metadata.imagePlacements) setImagePlacements(metadata.imagePlacements);
    if (metadata.selectedColors) setSelectedColors(metadata.selectedColors);
    if (metadata.textSize) setTextSize(metadata.textSize);
    if (metadata.theme) setTheme(metadata.theme);
    if (metadata.customFont) {
      // Check if font already exists in uploadedFonts
      setUploadedFonts(prev => {
        if (!prev.some(f => f.name === metadata.customFont.name)) {
          return [...prev, metadata.customFont];
        }
        return prev;
      });
      setSelectedFont(metadata.customFont.name);
    }
    alert('Note successfully imported from HTML!');
  };

  const stringifyData = (data: any[]) => {
    if (promptFormat === 'JSON') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV
      const rows: any[] = [];
      data.forEach(group => {
        if (group.ITEMS && Array.isArray(group.ITEMS)) {
          group.ITEMS.forEach((item: any) => {
            rows.push({
              GROUP: group.GROUP || '',
              TYPE: item.TYPE || '',
              CONTENT: item.CONTENT || ''
            });
          });
        }
      });
      return Papa.unparse(rows);
    }
  };

  const handleSyncInput = () => {
    if (!parsedData) return;
    const syncedInput = stringifyData(parsedData);
    setInput(syncedInput);
    localStorage.setItem('arcane-notes-input', syncedInput);
  };

  const handleReset = () => {
    setParsedData(null);
    setInput('');
    setError(null);
    setExtractedImages([]);
  };

  const renderAccordionSection = (id: string, title: string, Icon: any, children: React.ReactNode) => {
    const isActive = activeSettingsSection === id;
    return (
      <div className={cn(
        "overflow-hidden mb-3 transition-all",
        theme === 'modern' && "border border-slate-200 rounded-xl bg-white shadow-sm",
        theme === 'professional' && "border border-slate-300 rounded-lg bg-white shadow-sm",
        theme === 'cyberpunk' && "border border-cyan-500/50 rounded-none bg-black/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
        theme === 'vintage' && "border-2 border-[#d4c5a1] rounded-sm bg-[#fdfbf7]",
        theme === 'terminal' && "border border-green-500/50 rounded-none bg-black",
        theme === 'ethereal' && "border border-indigo-100 rounded-2xl bg-white/60 backdrop-blur-sm",
        theme === 'prism' && "border-none rounded-2xl bg-white shadow-md",
        theme === 'minecraft' && "border-4 border-[#373737] rounded-none bg-[#c6c6c6] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff]",
        theme === 'undertale' && "border-2 border-white rounded-none bg-black",
        theme === 'god-of-war' && "border border-[#8b0000] rounded-none bg-[#1a1a1a]",
        theme === 'cuphead' && "border-4 border-black rounded-none bg-[#f5f5dc] shadow-[4px_4px_0_rgba(0,0,0,1)]",
        theme === 'comic' && "border-4 border-black rounded-none bg-white shadow-[4px_4px_0_rgba(0,0,0,1)]"
      )}>
        <button
          onClick={() => setActiveSettingsSection(isActive ? null : id)}
          className={cn(
            "w-full flex items-center justify-between p-4 transition-colors",
            theme === 'modern' && "bg-slate-50 hover:bg-slate-100",
            theme === 'professional' && "bg-slate-100 hover:bg-slate-200",
            theme === 'cyberpunk' && "bg-cyan-950/20 hover:bg-cyan-900/40",
            theme === 'vintage' && "bg-[#f4ecd8] hover:bg-[#e6d5b8]",
            theme === 'terminal' && "bg-green-900/20 hover:bg-green-900/40",
            theme === 'ethereal' && "bg-indigo-50/50 hover:bg-indigo-100/50",
            theme === 'prism' && "bg-slate-50 hover:bg-slate-100",
            theme === 'minecraft' && "bg-[#8b8b8b] hover:bg-[#a0a0a0]",
            theme === 'undertale' && "bg-white/10 hover:bg-white/20",
            theme === 'god-of-war' && "bg-[#2a2a2a] hover:bg-[#3a3a3a]",
            theme === 'cuphead' && "bg-[#e8e8d0] hover:bg-[#d8d8c0]",
            theme === 'comic' && "bg-yellow-100 hover:bg-yellow-200"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn(
              "w-5 h-5",
              theme === 'modern' && "text-blue-500",
              theme === 'professional' && "text-slate-700",
              theme === 'cyberpunk' && "text-cyan-400",
              theme === 'vintage' && "text-[#8b4513]",
              theme === 'terminal' && "text-green-500",
              theme === 'ethereal' && "text-indigo-500",
              theme === 'prism' && "text-blue-600",
              theme === 'minecraft' && "text-white",
              theme === 'undertale' && "text-white",
              theme === 'god-of-war' && "text-[#ffd700]",
              theme === 'cuphead' && "text-black",
              theme === 'comic' && "text-black"
            )} />
            <span className={cn(
              "font-bold",
              theme === 'modern' && "text-slate-700",
              theme === 'professional' && "text-slate-800 font-serif",
              theme === 'cyberpunk' && "text-cyan-100 font-mono tracking-wider",
              theme === 'vintage' && "text-[#4a3728] font-serif",
              theme === 'terminal' && "text-green-400 font-mono tracking-wider",
              theme === 'ethereal' && "text-indigo-900 font-serif",
              theme === 'prism' && "text-slate-800 tracking-tight",
              theme === 'minecraft' && "text-white font-pixel text-sm drop-shadow-[2px_2px_0_#373737]",
              theme === 'undertale' && "text-yellow-400 font-retro tracking-widest",
              theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase tracking-widest",
              theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
              theme === 'comic' && "text-black font-black uppercase tracking-tighter italic"
            )}>{title}</span>
          </div>
          <motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className={cn(
              "w-5 h-5",
              theme === 'modern' && "text-slate-400",
              theme === 'professional' && "text-slate-500",
              theme === 'cyberpunk' && "text-cyan-600",
              theme === 'vintage' && "text-[#8b4513]/60",
              theme === 'terminal' && "text-green-700",
              theme === 'ethereal' && "text-indigo-400",
              theme === 'prism' && "text-slate-400",
              theme === 'minecraft' && "text-[#373737]",
              theme === 'undertale' && "text-white/50",
              theme === 'god-of-war' && "text-[#ffd700]/50",
              theme === 'cuphead' && "text-black/50",
              theme === 'comic' && "text-black/50"
            )} />
          </motion.div>
        </button>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "p-4 space-y-6",
                theme === 'modern' && "border-t border-slate-100 bg-white",
                theme === 'professional' && "border-t border-slate-200 bg-white",
                theme === 'cyberpunk' && "border-t border-cyan-500/30 bg-black/80",
                theme === 'vintage' && "border-t-2 border-[#d4c5a1] bg-[#fdfbf7]",
                theme === 'terminal' && "border-t border-green-500/30 bg-black",
                theme === 'ethereal' && "border-t border-indigo-50 bg-white/50",
                theme === 'prism' && "border-t border-slate-100 bg-white",
                theme === 'minecraft' && "border-t-4 border-[#373737] bg-[#c6c6c6]",
                theme === 'undertale' && "border-t-2 border-white bg-black",
                theme === 'god-of-war' && "border-t border-[#8b0000] bg-[#1a1a1a]",
                theme === 'cuphead' && "border-t-4 border-black bg-[#f5f5dc]",
                theme === 'comic' && "border-t-4 border-black bg-white"
              )}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn(
      "min-h-screen p-4 md:p-8 font-sans transition-colors duration-500",
      theme === 'modern' && "bg-slate-50 text-slate-900",
      theme === 'professional' && "bg-[#f8fafc] text-slate-900",
      theme === 'cyberpunk' && "bg-[#050505] text-cyan-50",
      theme === 'vintage' && "bg-[#fdfbf7] text-[#4a3728]",
      theme === 'terminal' && "bg-black text-green-500",
      theme === 'ethereal' && "bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-indigo-900",
      theme === 'prism' && "bg-slate-50 text-slate-900",
      theme === 'minecraft' && "bg-[#4d4d4d] text-white",
      theme === 'undertale' && "bg-black text-white font-retro",
      theme === 'god-of-war' && "bg-[#0a0a0a] text-slate-100",
      theme === 'cuphead' && "bg-[#f4e4bc] text-black",
      theme === 'comic' && "bg-[#f0f0f0] text-black",
      theme === 'realistic' && "bg-slate-100 text-slate-900"
    )}>
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/')}
              className={cn(
                "p-2.5 rounded-xl shadow-sm border transition-all active:scale-95",
                theme === 'modern' && "bg-white border-slate-200 text-slate-500 hover:text-blue-600",
                theme === 'professional' && "bg-white border-slate-200 text-slate-600 hover:text-slate-900",
                theme === 'cyberpunk' && "bg-black border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
                theme === 'vintage' && "bg-[#fdfbf7] border-[#4a3728] text-[#4a3728] hover:bg-[#f4f1ea]",
                theme === 'terminal' && "bg-black border-green-500/50 text-green-500 hover:border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
                theme === 'ethereal' && "bg-white/80 backdrop-blur-md border-indigo-100 text-indigo-400 hover:text-indigo-600",
                theme === 'prism' && "bg-white border-slate-200 text-slate-500 hover:text-blue-600",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] text-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
                theme === 'undertale' && "bg-black border-4 border-white text-white rounded-none hover:text-yellow-400 hover:border-yellow-400",
                theme === 'god-of-war' && "bg-[#1a0f0f] border-2 border-[#8b0000] text-[#8b0000] hover:text-[#ffd700] hover:border-[#ffd700]",
                theme === 'cuphead' && "bg-white border-4 border-black text-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white border-4 border-black text-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)]",
                theme === 'realistic' && "bg-white border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={cn(
              "p-2 rounded-lg shadow-md",
              theme === 'modern' && "bg-blue-600",
              theme === 'professional' && "bg-slate-900",
              theme === 'cyberpunk' && "bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]",
              theme === 'vintage' && "bg-[#4a3728]",
              theme === 'terminal' && "bg-green-500",
              theme === 'ethereal' && "bg-indigo-500",
              theme === 'prism' && "bg-blue-600",
              theme === 'minecraft' && "bg-[#388e3c] border-2 border-[#1e1e1e] rounded-none",
              theme === 'undertale' && "bg-white rounded-none",
              theme === 'god-of-war' && "bg-[#8b0000] border-2 border-[#ffd700]/30",
              theme === 'cuphead' && "bg-red-500 border-4 border-black rounded-none",
              theme === 'comic' && "bg-yellow-400 border-4 border-black rounded-none",
              theme === 'realistic' && "bg-slate-800"
            )}>
              <FileCode className={cn(
                "w-6 h-6",
                theme === 'undertale' ? "text-black" : "text-white",
                theme === 'cuphead' && "text-black",
                theme === 'comic' && "text-black"
              )} />
            </div>
            <h1 className={cn(
              "text-2xl font-bold tracking-tight",
              theme === 'modern' && "text-slate-800",
              theme === 'professional' && "text-slate-900 font-serif",
              theme === 'cyberpunk' && "text-cyan-400 italic uppercase tracking-widest",
              theme === 'vintage' && "text-[#4a3728] font-serif italic",
              theme === 'terminal' && "text-green-500 font-mono",
              theme === 'ethereal' && "text-indigo-900",
              theme === 'prism' && "text-slate-800",
              theme === 'minecraft' && "text-white font-pixel text-3xl",
              theme === 'undertale' && "text-white font-retro tracking-wider",
              theme === 'god-of-war' && "text-[#ffd700] uppercase tracking-[0.2em]",
              theme === 'cuphead' && "text-black font-black italic",
              theme === 'comic' && "text-black font-black uppercase italic",
              theme === 'realistic' && "text-slate-900"
            )}>Arcane Notes</h1>
          </div>
      {parsedData && (
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleReset}
            className={cn(
              "flex items-center px-4 py-2.5 text-sm font-medium transition-all shadow-sm active:scale-95",
              theme === 'modern' && "text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50",
              theme === 'professional' && "text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50",
              theme === 'cyberpunk' && "text-cyan-400 bg-black border border-cyan-500/30 rounded-none hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
              theme === 'vintage' && "text-[#4a3728] bg-[#fdfbf7] border border-[#4a3728] rounded-none hover:bg-[#f4f1ea]",
              theme === 'terminal' && "text-green-500 bg-black border border-green-500/50 rounded-none font-mono hover:border-green-400",
              theme === 'ethereal' && "text-indigo-600 bg-white/80 backdrop-blur-md border border-indigo-100 rounded-2xl hover:bg-white",
              theme === 'prism' && "text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50",
              theme === 'minecraft' && "text-[#373737] bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0]",
              theme === 'undertale' && "text-white bg-black border-4 border-white rounded-none font-retro hover:text-yellow-400 hover:border-yellow-400",
              theme === 'god-of-war' && "text-[#ffd700] bg-[#1a0f0f] border-2 border-[#8b0000] rounded-none hover:border-[#ffd700]",
              theme === 'cuphead' && "text-black bg-white border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]",
              theme === 'comic' && "text-black bg-white border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]",
              theme === 'realistic' && "text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
            )}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Start Over
          </button>
        </div>
      )}
        </header>

        <div className={parsedData ? "flex flex-col space-y-8" : "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"}>
          
          {/* Input Panel */}
          <div className={`${parsedData ? 'hidden' : 'lg:col-span-8 lg:col-start-3'}`}>
            <motion.div 
              layout
              className={cn(
                "overflow-hidden flex flex-col h-[calc(100vh-12rem)] transition-all duration-300",
                theme === 'modern' && "bg-white rounded-2xl shadow-sm border border-slate-200",
                theme === 'professional' && "bg-white rounded-xl shadow-sm border border-slate-200",
                theme === 'cyberpunk' && "bg-black/60 backdrop-blur-md rounded-none border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]",
                theme === 'vintage' && "bg-[#fdfbf7] rounded-none border-2 border-[#4a3728]",
                theme === 'terminal' && "bg-black rounded-none border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
                theme === 'ethereal' && "bg-white/40 backdrop-blur-xl rounded-3xl border border-indigo-100 shadow-[0_20px_50px_rgba(79,70,229,0.05)]",
                theme === 'prism' && "bg-white rounded-2xl shadow-sm border border-slate-200",
                theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
                theme === 'undertale' && "bg-black rounded-none border-4 border-white",
                theme === 'god-of-war' && "bg-[#1a0f0f]/90 rounded-none border-2 border-[#8b0000] shadow-[0_0_40px_rgba(139,0,0,0.2)]",
                theme === 'cuphead' && "bg-[#f4e4bc] rounded-none border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white rounded-none border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]",
                theme === 'realistic' && "bg-white rounded-xl shadow-md border border-slate-300"
              )}
            >
              <div className={cn(
                "p-5 flex items-center justify-between transition-colors duration-300",
                theme === 'modern' && "border-b border-slate-100 bg-white",
                theme === 'professional' && "border-b border-slate-100 bg-slate-50/50",
                theme === 'cyberpunk' && "border-b border-cyan-500/30 bg-black/40",
                theme === 'vintage' && "border-b border-[#4a3728] bg-[#f4ecd8]/30",
                theme === 'terminal' && "border-b border-green-500/30 bg-black",
                theme === 'ethereal' && "border-b border-indigo-50 bg-white/20",
                theme === 'prism' && "border-b border-slate-100 bg-white",
                theme === 'minecraft' && "border-b-4 border-[#373737] bg-[#8b8b8b]",
                theme === 'undertale' && "border-b-4 border-white bg-black",
                theme === 'god-of-war' && "border-b-2 border-[#8b0000] bg-[#2a0000]/40",
                theme === 'cuphead' && "border-b-4 border-black bg-white",
                theme === 'comic' && "border-b-4 border-black bg-yellow-400",
                theme === 'realistic' && "border-b border-slate-200 bg-slate-50"
              )}>
                <h2 className={cn(
                  "font-bold flex items-center",
                  theme === 'modern' && "text-slate-800",
                  theme === 'professional' && "text-slate-900 font-serif",
                  theme === 'cyberpunk' && "text-cyan-400 uppercase tracking-widest",
                  theme === 'vintage' && "text-[#4a3728] font-serif italic",
                  theme === 'terminal' && "text-green-500 font-mono",
                  theme === 'ethereal' && "text-indigo-900",
                  theme === 'prism' && "text-slate-800",
                  theme === 'minecraft' && "text-white font-pixel text-xl",
                  theme === 'undertale' && "text-white font-retro tracking-wider",
                  theme === 'god-of-war' && "text-[#ffd700] uppercase tracking-widest",
                  theme === 'cuphead' && "text-black font-black italic",
                  theme === 'comic' && "text-black font-black uppercase italic",
                  theme === 'realistic' && "text-slate-900"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mr-3",
                    theme === 'modern' && "bg-blue-50 text-blue-500",
                    theme === 'professional' && "bg-slate-100 text-slate-600",
                    theme === 'cyberpunk' && "bg-cyan-950/50 text-cyan-400 border border-cyan-500/30",
                    theme === 'vintage' && "bg-[#4a3728] text-[#fdfbf7]",
                    theme === 'terminal' && "bg-green-950/50 text-green-500 border border-green-500/30",
                    theme === 'ethereal' && "bg-indigo-50 text-indigo-500",
                    theme === 'prism' && "bg-blue-50 text-blue-500",
                    theme === 'minecraft' && "bg-[#373737] text-white rounded-none border-2 border-[#1e1e1e]",
                    theme === 'undertale' && "bg-white text-black rounded-none",
                    theme === 'god-of-war' && "bg-[#8b0000] text-[#ffd700] border border-[#ffd700]/30",
                    theme === 'cuphead' && "bg-red-500 text-white border-2 border-black rounded-none",
                    theme === 'comic' && "bg-white text-black border-2 border-black rounded-none",
                    theme === 'realistic' && "bg-slate-200 text-slate-700"
                  )}>
                    <FileJson className="w-5 h-5" />
                  </div>
                  Input Data
                </h2>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setInput(`Cardiology, TITLE, [c:#ef4444]Cardio[vascular]{Vascular|relating to blood vessels|the pipes of the body|Includes arteries and veins} System[/c]
Cardiology, SUMMARY, This document provides a **comprehensive overview** of the cardiovascular system, including [[Heart]] function, common [pathologies]{Pathology|the science of the causes and effects of diseases|study of disease|Crucial for diagnosis}, and diagnostic procedures.
Cardiology, SUBHEADER, Overview of Cardiac [Function]{Function|how something works|the job it does|Crucial for life}
Cardiology, DEFINITION, [[Heart]]: A **muscular organ** that pumps [[Blood]] through the circulatory system.
Cardiology, EXPLANATION, The [[Heart]] pumps [[Blood]] using [cardiac output]{Cardiac Output|amount of blood pumped by heart per minute|how much blood your heart pushes every minute|CO = HR × SV} which is the product of **heart rate** and *stroke volume*.
Cardiology, BULLET, This is a standard bullet point with **bold** and *italic* text.
Cardiology, BULLET, Another bullet point to show multiple items in a list, including a [link](https://example.com).
Cardiology, WARNING, Patient **must** be monitored for [arrhythmias]{Arrhythmia|a condition in which the heart beats with an irregular or abnormal rhythm|an irregular heartbeat|Can be too fast or too slow} during the procedure.
Cardiology, TIP, Regular *aerobic* exercise improves cardiovascular health and reduces the risk of **heart disease**.
Cardiology, IMPORTANT, **EXAM TIP:** The [SA node]{SA Node|the heart's natural pacemaker|the spark plug of the heart|Located in the right atrium} is the natural pacemaker of the [[Heart]].
Cardiology, KEY_POINT, The most crucial takeaway is that **time is muscle** during a myocardial infarction.
Cardiology, CODE, Administer [Aspirin]{Aspirin|a medication used to reduce pain, fever, or inflammation|a blood thinner|Often used in heart attacks} 81mg PO daily
Cardiology, QUOTE, "The [[Heart]] has its reasons which reason knows nothing of." - *Blaise Pascal*
Cardiology, CHECKLIST, Check **blood pressure** and heart rate
Cardiology, CHECKLIST, Auscultate *heart sounds* (S1, S2)
Cardiology, EXAMPLE, For instance, a patient presents with [chest pain]{Angina|a type of chest pain caused by reduced blood flow to the heart|heart pain|Can feel like pressure or squeezing} radiating to the left arm.
Cardiology, FORMULA, BP = CO \\times SVR \\text{ (Blood Pressure = Cardiac Output } \\times \\text{ Systemic Vascular Resistance)}
Cardiology, CALLOUT, **Note:** Women may present with *atypical* symptoms of myocardial infarction, such as fatigue or nausea.
Cardiology, STEP, First, assess **airway**, **breathing**, and **circulation** (ABCs).
Cardiology, STEP, Second, obtain a 12-lead [[ECG]] immediately.
Cardiology, TIMELINE, 0 min | Patient arrives at ED with **chest pain**
Cardiology, TIMELINE, 10 min | [[ECG]] completed and interpreted
Cardiology, DIVIDER, 
Cardiology, TABLE_HEAD, [Condition]{Condition|a medical state|the problem} | Symptoms | Treatment
Cardiology, TABLE_ROW, **STEMI** | Chest pain, *ST elevation* | PCI, Thrombolytics
Cardiology, TABLE_ROW, **NSTEMI** | Chest pain, *ST depression* | [Antiplatelets]{Antiplatelets|medicines that stop blood cells from sticking together|clot preventers|Example: Aspirin}, Anticoagulants
Cardiology, SUBHEADER, Arabic Explanations (RTL Support)
Cardiology, AR_EXPLANATION, القلب بيضخ الدم لكل الجسم عن طريق حاجة اسمها الـ [Cardiac Output]{Cardiac Output|amount of blood pumped by heart per minute|how much blood your heart pushes every minute|CO = HR × SV}، واللي هي عبارة عن حاصل ضرب سرعة ضربات القلب في كمية الدم اللي بتضخ في النبضة الواحدة.
Cardiology, AR_SIMPLIFY, ببساطة، الـ **Heart** عامل زي المضخة، كل ما يشتغل أسرع أو أقوى، بيوصل [[Blood]] أكتر للأعضاء.
Cardiology, AR_DEFINITION, [[الذبحة الصدرية]]: هي ألم أو وجع في الصدر بيحصل لما عضلة القلب ميوصلهاش دم كفاية، وغالباً بيكون بسبب ضيق في الشرايين التاجية.
Cardiology, AR_KEY_POINT, **أهم حاجة تفتكرها:** لو المريض جاله ألم في الصدر بيسمّع في كتفه الشمال، لازم تعمله [[ECG]] فوراً!
Cardiology, AR_EXAMPLE, **مثال:** مريض دخل الطوارئ بيشتكي من [Chest Pain]{Angina|a type of chest pain caused by reduced blood flow to the heart|heart pain|Can feel like pressure or squeezing} مع عرق شديد، ده ممكن يكون مؤشر لجلطة في القلب.
Cardiology, MCQ, "{""question"": ""What is the primary function of the **SA node**?"", ""options"": [""To pump blood to the lungs"", ""To act as the natural pacemaker of the heart"", ""To oxygenate the blood"", ""To filter waste from the blood""], ""answer"": ""To act as the natural pacemaker of the heart"", ""explanation"": ""The [SA node]{SA Node|the heart's natural pacemaker|the spark plug of the heart|Located in the right atrium} generates electrical impulses that set the rhythm of the heart.""}"
Cardiology, ESSAY, "{""question"": ""Explain the difference between **STEMI** and **NSTEMI**."", ""answer"": ""A STEMI involves full-thickness damage of heart muscle with ST-segment elevation on an ECG, requiring immediate reperfusion. An NSTEMI involves partial-thickness damage without ST elevation, typically managed with medications and delayed angiography."", ""explanation"": ""Both are types of heart attacks, but STEMI is generally more severe and requires more urgent intervention like PCI.""}"

Neurology, TITLE, [c:#8b5cf6]Nervous System[/c]
Neurology, SUBHEADER, Central Nervous System
Neurology, DEFINITION, [[Brain]]: The control center of the nervous system.
Neurology, EXPLANATION, Neurons communicate via [action potentials]{Action Potential|a rapid sequence of changes in the voltage across a membrane|an electrical signal that travels down a nerve|Threshold is typically -55mV} that travel along the axon.
Neurology, BULLET, The CNS consists of the [[Brain]] and spinal cord.
Neurology, BULLET, The PNS consists of nerves and ganglia outside the CNS.
Neurology, WARNING, Increased [intracranial]{Intracranial|within the skull|inside the head|Can be pressure or bleeding} pressure is a medical emergency.
Neurology, TIP, The Glasgow Coma Scale is used to assess consciousness.
Neurology, IMPORTANT, The blood-brain barrier protects the [[Brain]] from toxins.
Neurology, CODE, Administer [tPA]{tPA|tissue plasminogen activator|a clot-busting drug|Must be given within 4.5 hours} within 3-4.5 hours of ischemic stroke onset
Neurology, QUOTE, "The [[Brain]] is a world consisting of a number of unexplored continents and great stretches of unknown territory."
Neurology, CHECKLIST, Assess pupillary response
Neurology, CHECKLIST, Test motor function
Neurology, EXAMPLE, Patient presents with unilateral facial droop and arm weakness.
Neurology, FORMULA, CPP = MAP - ICP
Neurology, CALLOUT, Note: Time is [[Brain]] in acute stroke management.
Neurology, STEP, Perform a rapid neurological assessment.
Neurology, STEP, Obtain a non-contrast head CT.
Neurology, TIMELINE, 0 min | Patient arrives at ED
Neurology, TIMELINE, 25 min | Head CT completed
Neurology, DIVIDER, 
Neurology, TABLE_HEAD, Lobe | Primary Function | Deficit
Neurology, TABLE_ROW, Frontal | Executive function, motor | Personality changes, weakness
Neurology, TABLE_ROW, Temporal | Hearing, memory | [Aphasia]{Aphasia|a language disorder that affects a person's ability to communicate|speech trouble|Can be expressive or receptive}, memory loss
Neurology, SUBHEADER, Neurotransmitters
Neurology, EXPLANATION, [Dopamine]{Dopamine|a neurotransmitter that plays several important roles in the brain and body|the "reward" chemical|Involved in movement and motivation} is crucial for the reward system.
Neurology, TABLE_HEAD, Neurotransmitter | Type | Function
Neurology, TABLE_ROW, Acetylcholine | Excitatory | Muscle contraction, memory
Neurology, TABLE_ROW, GABA | Inhibitory | Reduces neuronal excitability

Gastroenterology, TITLE, [c:#10b981]Gastrointestinal System[/c]
Gastroenterology, SUBHEADER, Digestive Process
Gastroenterology, DEFINITION, Digestion: The process of breaking down food into smaller components.
Gastroenterology, EXPLANATION, The [stomach]{Stomach|a muscular organ located on the left side of the upper abdomen|the food blender|Secretes acid and enzymes to digest food} is a key organ in digestion.
Gastroenterology, BULLET, Digestion begins in the mouth with salivary amylase.
Gastroenterology, BULLET, The small intestine is where most nutrient absorption occurs.
Gastroenterology, WARNING, Severe abdominal pain may indicate a surgical emergency.
Gastroenterology, TIP, A high-fiber diet promotes healthy digestion.
Gastroenterology, IMPORTANT, [H. pylori]{H. pylori|a type of bacteria that can infect your stomach|stomach bug|Can cause ulcers and cancer} is a common cause of peptic ulcers.
Gastroenterology, CODE, Administer [Omeprazole]{Omeprazole|a proton pump inhibitor|acid blocker|Used for GERD and ulcers} 20mg PO daily
Gastroenterology, QUOTE, "All disease begins in the gut."
Gastroenterology, CHECKLIST, Palpate abdomen
Gastroenterology, CHECKLIST, Check for bowel sounds
Gastroenterology, EXAMPLE, Patient presents with epigastric pain relieved by food.
Gastroenterology, FORMULA, BMI = weight / height²
Gastroenterology, CALLOUT, Note: Celiac disease requires a strict gluten-free diet.
Gastroenterology, STEP, Perform a physical examination.
Gastroenterology, STEP, Order [[Blood]] tests and imaging.
Gastroenterology, TIMELINE, 0 min | Patient arrives at ED
Gastroenterology, TIMELINE, 45 min | Abdominal ultrasound completed
Gastroenterology, DIVIDER, 
Gastroenterology, TABLE_HEAD, Organ | Function | Secretion
Gastroenterology, TABLE_ROW, Liver | Detoxification, bile production | [Bile]{Bile|a fluid that aids digestion and is secreted by the liver|fat dissolver|Stored in the gallbladder}
Gastroenterology, TABLE_ROW, Pancreas | Enzyme production, [[Insulin]] | [Insulin]{Insulin|a hormone that regulates blood sugar|sugar controller|Produced by beta cells}
Gastroenterology, SUBHEADER, Common Disorders
Gastroenterology, EXPLANATION, [GERD]{GERD|Gastroesophageal reflux disease|chronic acid reflux|Can cause heartburn and esophagus damage} is a chronic digestive disease.
Gastroenterology, TABLE_HEAD, Disorder | Symptoms | Treatment
Gastroenterology, TABLE_ROW, IBS | Bloating, gas, diarrhea | Diet changes, stress management
Gastroenterology, TABLE_ROW, IBD | Inflammation, pain, bleeding | [Immunosuppressants]{Immunosuppressants|drugs that lower the body's immune response|immune blockers|Used for autoimmune diseases}, Surgery`)}
                    className={cn(
                      "text-xs font-bold transition-all active:scale-95 px-3 py-1.5 rounded-lg",
                      theme === 'modern' && "text-blue-600 bg-blue-50 hover:bg-blue-100",
                      theme === 'professional' && "text-slate-600 bg-slate-100 hover:bg-slate-200",
                      theme === 'cyberpunk' && "text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-900/50",
                      theme === 'vintage' && "text-[#8b7355] bg-[#f4ecd8] hover:bg-[#e8dec0]",
                      theme === 'terminal' && "text-green-500 bg-green-900/20 hover:bg-green-900/40 border border-green-900/50 font-mono",
                      theme === 'ethereal' && "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
                      theme === 'prism' && "text-blue-600 bg-blue-50 hover:bg-blue-100",
                      theme === 'minecraft' && "text-white bg-[#545454] hover:bg-[#373737] border-b-4 border-r-4 border-[#1e1e1e] rounded-none",
                      theme === 'undertale' && "text-white bg-black hover:bg-white/10 border-2 border-white rounded-none font-retro",
                      theme === 'god-of-war' && "text-[#8b0000] bg-black hover:bg-[#1a1a1a] border border-[#8b0000]/30 rounded-none",
                      theme === 'cuphead' && "text-black bg-white hover:bg-[#f4e4bc] border-2 border-black rounded-none",
                      theme === 'comic' && "text-black bg-white hover:bg-yellow-50 border-2 border-black rounded-none italic",
                      theme === 'realistic' && "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    )}
                  >
                    Load Sample
                  </button>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest transition-colors",
                    theme === 'modern' && "text-slate-400 bg-slate-100",
                    theme === 'professional' && "text-slate-400 bg-slate-100",
                    theme === 'cyberpunk' && "text-cyan-900 bg-cyan-400/20",
                    theme === 'vintage' && "text-[#d4c5a1] bg-[#5c4b37]/10",
                    theme === 'terminal' && "text-green-900 bg-green-500/20 font-mono",
                    theme === 'ethereal' && "text-indigo-300 bg-indigo-50/50",
                    theme === 'prism' && "text-slate-400 bg-slate-100",
                    theme === 'minecraft' && "text-slate-400 bg-black/40 rounded-none",
                    theme === 'undertale' && "text-white/40 bg-white/5 rounded-none font-retro",
                    theme === 'god-of-war' && "text-[#8b0000]/40 bg-black/40 rounded-none",
                    theme === 'cuphead' && "text-black/40 bg-black/5 rounded-none",
                    theme === 'comic' && "text-black/40 bg-black/5 rounded-none italic",
                    theme === 'realistic' && "text-slate-400 bg-slate-100"
                  )}>JSON / CSV</span>
                </div>
              </div>
              <div className={cn(
                "flex-1 p-6 flex flex-col",
                theme === 'modern' && "bg-slate-50/30",
                theme === 'professional' && "bg-slate-50/50",
                theme === 'cyberpunk' && "bg-black/20",
                theme === 'vintage' && "bg-[#f4ecd8]/10",
                theme === 'terminal' && "bg-black/40",
                theme === 'ethereal' && "bg-indigo-50/10",
                theme === 'prism' && "bg-slate-50/30",
                theme === 'minecraft' && "bg-black/20",
                theme === 'undertale' && "bg-black/40",
                theme === 'god-of-war' && "bg-black/40",
                theme === 'cuphead' && "bg-black/5",
                theme === 'comic' && "bg-black/5",
                theme === 'realistic' && "bg-slate-100/30"
              )}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste your JSON or CSV data here..."
                  className={cn(
                    "w-full flex-1 resize-none p-6 font-mono text-sm outline-none transition-all shadow-inner",
                    theme === 'modern' && "bg-white border-2 border-slate-100 rounded-2xl text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500",
                    theme === 'professional' && "bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500",
                    theme === 'cyberpunk' && "bg-black/60 border-2 border-cyan-900/50 rounded-xl text-cyan-400 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 placeholder:text-cyan-900",
                    theme === 'vintage' && "bg-[#fdfbf7] border-2 border-[#d4c5a1] rounded-xl text-[#4a3728] focus:ring-4 focus:ring-[#8b7355]/10 focus:border-[#8b7355] placeholder:text-[#d4c5a1]",
                    theme === 'terminal' && "bg-black border-2 border-green-900/50 rounded-lg text-green-500 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 placeholder:text-green-900",
                    theme === 'ethereal' && "bg-white/80 backdrop-blur-md border border-indigo-100 rounded-3xl text-indigo-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 placeholder:text-indigo-200",
                    theme === 'prism' && "bg-white border-2 border-slate-100 rounded-2xl text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400",
                    theme === 'minecraft' && "bg-[#1e1e1e] border-4 border-[#373737] rounded-none text-white focus:border-white placeholder:text-[#545454]",
                    theme === 'undertale' && "bg-black border-4 border-white rounded-none text-white focus:border-yellow-400 placeholder:text-white/20 font-retro",
                    theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000]/30 rounded-lg text-[#e0e0e0] focus:border-[#8b0000] placeholder:text-[#8b0000]/40",
                    theme === 'cuphead' && "bg-white border-4 border-black rounded-none text-black focus:ring-4 focus:ring-black/10 placeholder:text-black/20",
                    theme === 'comic' && "bg-white border-4 border-black rounded-none text-black focus:ring-4 focus:ring-black/10 placeholder:text-black/20",
                    theme === 'realistic' && "bg-white border-2 border-slate-200 rounded-xl text-slate-700 focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 shadow-sm"
                  )}
                  spellCheck={false}
                />
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "mt-4 p-3 text-sm rounded-lg border",
                        theme === 'modern' && "bg-red-50 border-red-100 text-red-600",
                        theme === 'professional' && "bg-red-50 border-red-200 text-red-700",
                        theme === 'cyberpunk' && "bg-red-900/20 border-red-900/50 text-red-400",
                        theme === 'vintage' && "bg-[#f4ecd8] border-red-200 text-red-800",
                        theme === 'terminal' && "bg-black border-red-900 text-red-500",
                        theme === 'ethereal' && "bg-red-50/50 border-red-100 text-red-600",
                        theme === 'prism' && "bg-red-50 border-red-100 text-red-600",
                        theme === 'minecraft' && "bg-[#8b0000]/20 border-[#8b0000] text-white",
                        theme === 'undertale' && "bg-black border-red-600 text-red-600 font-retro",
                        theme === 'god-of-war' && "bg-[#8b0000]/10 border-[#8b0000]/30 text-[#8b0000]",
                        theme === 'cuphead' && "bg-white border-4 border-black text-red-600",
                        theme === 'comic' && "bg-white border-4 border-black text-red-600",
                        theme === 'realistic' && "bg-red-50 border-red-200 text-red-700"
                      )}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsPromptModalOpen(true)}
                    className={cn(
                      "w-full flex items-center justify-center px-6 py-4 font-bold transition-all active:scale-[0.98] shadow-sm",
                      theme === 'modern' && "bg-white text-purple-600 border-2 border-purple-100 rounded-2xl hover:bg-purple-50 hover:border-purple-200",
                      theme === 'professional' && "bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50",
                      theme === 'cyberpunk' && "bg-black text-cyan-400 border border-cyan-500/30 rounded-none hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
                      theme === 'vintage' && "bg-[#fdfbf7] text-[#4a3728] border-2 border-[#4a3728] rounded-none hover:bg-[#f4f1ea]",
                      theme === 'terminal' && "bg-black text-green-500 border border-green-500/50 rounded-none font-mono hover:border-green-400",
                      theme === 'ethereal' && "bg-white/80 backdrop-blur-md text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-white",
                      theme === 'prism' && "bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50",
                      theme === 'minecraft' && "bg-[#c6c6c6] text-[#373737] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0]",
                      theme === 'undertale' && "bg-black text-white border-4 border-white rounded-none font-retro hover:text-yellow-400 hover:border-yellow-400",
                      theme === 'god-of-war' && "bg-[#1a0f0f] text-[#ffd700] border-2 border-[#8b0000] rounded-none hover:border-[#ffd700]",
                      theme === 'cuphead' && "bg-white text-black border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]",
                      theme === 'comic' && "bg-white text-black border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]",
                      theme === 'realistic' && "bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
                    )}
                  >
                    <Sparkles className="w-5 h-5 mr-2" /> Configure AI Prompt
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !input.trim()}
                    className={cn(
                      "w-full flex items-center justify-center px-6 py-4 font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                      theme === 'modern' && "bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300",
                      theme === 'professional' && "bg-slate-900 text-white rounded-lg hover:bg-black shadow-lg shadow-slate-200",
                      theme === 'cyberpunk' && "bg-cyan-500 text-black rounded-none shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400",
                      theme === 'vintage' && "bg-[#4a3728] text-[#fdfbf7] rounded-none hover:bg-[#5c4b37]",
                      theme === 'terminal' && "bg-green-500 text-black rounded-none font-mono hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]",
                      theme === 'ethereal' && "bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700",
                      theme === 'prism' && "bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700",
                      theme === 'minecraft' && "bg-[#388e3c] text-white border-4 border-[#1e1e1e] rounded-none shadow-[inset_-4px_-4px_0_#1b5e20,inset_4px_4px_0_#81c784] hover:bg-[#4caf50]",
                      theme === 'undertale' && "bg-white text-black border-4 border-white rounded-none font-retro hover:bg-yellow-400",
                      theme === 'god-of-war' && "bg-[#8b0000] text-[#ffd700] border-2 border-[#ffd700]/30 rounded-none hover:bg-[#a00000]",
                      theme === 'cuphead' && "bg-red-500 text-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_rgba(0,0,0,1)]",
                      theme === 'comic' && "bg-blue-500 text-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_rgba(0,0,0,1)]",
                      theme === 'realistic' && "bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-lg"
                    )}
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2 fill-current" /> Generate Document
                      </>
                    )}
                  </button>

                  <label className="w-full">
                    <input 
                      type="file" 
                      accept=".pdf,.html,application/pdf,text/html" 
                      className="hidden" 
                      onChange={handleUniversalUpload}
                      disabled={isUploading}
                    />
                    <div className={cn(
                      "w-full flex items-center justify-center px-6 py-4 font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3",
                      theme === 'modern' && "bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300",
                      theme === 'professional' && "bg-indigo-900 text-white rounded-lg hover:bg-indigo-950 shadow-lg shadow-indigo-200",
                      theme === 'cyberpunk' && "bg-fuchsia-500 text-black rounded-none shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:bg-fuchsia-400",
                      theme === 'vintage' && "bg-[#8b4513] text-[#fdfbf7] rounded-none hover:bg-[#a0522d]",
                      theme === 'terminal' && "bg-amber-500 text-black rounded-none font-mono hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]",
                      theme === 'ethereal' && "bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-200 hover:bg-violet-700",
                      theme === 'prism' && "bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700",
                      theme === 'minecraft' && "bg-[#1976d2] text-white border-4 border-[#1e1e1e] rounded-none shadow-[inset_-4px_-4px_0_#0d47a1,inset_4px_4px_0_#64b5f6] hover:bg-[#2196f3]",
                      theme === 'undertale' && "bg-purple-600 text-white border-4 border-white rounded-none font-retro hover:bg-purple-500",
                      theme === 'god-of-war' && "bg-black text-[#ffd700] border-2 border-[#ffd700]/30 rounded-none hover:bg-[#1a1a1a]",
                      theme === 'cuphead' && "bg-yellow-500 text-black border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_rgba(0,0,0,1)]",
                      theme === 'comic' && "bg-yellow-400 text-black border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_rgba(0,0,0,1)]",
                      theme === 'realistic' && "bg-indigo-800 text-white rounded-lg hover:bg-indigo-900 shadow-lg"
                    )}>
                      {isUploading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5 mr-2" /> Upload PDF / HTML
                        </>
                      )}
                    </div>
                  </label>
                  {uploadError && (
                    <p className="mt-2 text-sm text-red-500 text-center font-medium">{uploadError}</p>
                  )}
                </div>

                {parsedData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mt-4 p-4 border rounded-2xl flex items-center justify-between transition-all duration-300",
                      theme === 'modern' && "bg-emerald-50 border-emerald-100",
                      theme === 'professional' && "bg-slate-50 border-slate-200",
                      theme === 'cyberpunk' && "bg-emerald-950/20 border-emerald-500/30",
                      theme === 'vintage' && "bg-[#f4ecd8]/30 border-[#d4c5a1]",
                      theme === 'terminal' && "bg-black border-green-500/30",
                      theme === 'ethereal' && "bg-indigo-50/50 border-indigo-100",
                      theme === 'prism' && "bg-emerald-50 border-emerald-100",
                      theme === 'minecraft' && "bg-[#313131] border-[#1e1e1e]",
                      theme === 'undertale' && "bg-black border-white/20",
                      theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/20",
                      theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                      theme === 'comic' && "bg-white border-black",
                      theme === 'realistic' && "bg-slate-50 border-slate-200"
                    )}
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        "p-2 rounded-lg mr-3 shadow-sm",
                        theme === 'modern' && "bg-emerald-500 text-white",
                        theme === 'professional' && "bg-slate-800 text-white",
                        theme === 'cyberpunk' && "bg-emerald-500 text-black",
                        theme === 'vintage' && "bg-[#4a3728] text-[#fdfbf7]",
                        theme === 'terminal' && "bg-green-500 text-black",
                        theme === 'ethereal' && "bg-indigo-500 text-white",
                        theme === 'prism' && "bg-emerald-500 text-white",
                        theme === 'minecraft' && "bg-[#388e3c] text-white border border-[#1e1e1e] rounded-none",
                        theme === 'undertale' && "bg-white text-black rounded-none",
                        theme === 'god-of-war' && "bg-[#8b0000] text-[#ffd700] border border-[#ffd700]/30",
                        theme === 'cuphead' && "bg-red-500 text-white border-2 border-black rounded-none",
                        theme === 'comic' && "bg-yellow-400 text-black border-2 border-black rounded-none",
                        theme === 'realistic' && "bg-slate-700 text-white"
                      )}>
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-bold",
                          theme === 'modern' && "text-emerald-900",
                          theme === 'professional' && "text-slate-900",
                          theme === 'cyberpunk' && "text-emerald-400",
                          theme === 'vintage' && "text-[#4a3728]",
                          theme === 'terminal' && "text-green-500",
                          theme === 'ethereal' && "text-indigo-900",
                          theme === 'prism' && "text-emerald-900",
                          theme === 'minecraft' && "text-white",
                          theme === 'undertale' && "text-white",
                          theme === 'god-of-war' && "text-[#ffd700]",
                          theme === 'cuphead' && "text-black",
                          theme === 'comic' && "text-black",
                          theme === 'realistic' && "text-slate-900"
                        )}>Data Synced</p>
                        <p className={cn(
                          "text-[10px] font-medium opacity-70",
                          theme === 'modern' && "text-emerald-600",
                          theme === 'professional' && "text-slate-500",
                          theme === 'cyberpunk' && "text-emerald-500",
                          theme === 'vintage' && "text-[#4a3728]",
                          theme === 'terminal' && "text-green-600",
                          theme === 'ethereal' && "text-indigo-600",
                          theme === 'prism' && "text-emerald-600",
                          theme === 'minecraft' && "text-slate-400",
                          theme === 'undertale' && "text-slate-400",
                          theme === 'god-of-war' && "text-slate-400",
                          theme === 'cuphead' && "text-black",
                          theme === 'comic' && "text-black",
                          theme === 'realistic' && "text-slate-600"
                        )}>Your preview is active. Sync back to text editor?</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSyncInput}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm",
                        theme === 'modern' && "bg-emerald-500 text-white hover:bg-emerald-600",
                        theme === 'professional' && "bg-emerald-600 text-white hover:bg-emerald-700",
                        theme === 'cyberpunk' && "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-900/40",
                        theme === 'vintage' && "bg-[#5c4b37] text-[#fdfbf7] hover:bg-[#8b7355]",
                        theme === 'terminal' && "bg-green-600 text-black hover:bg-green-500 shadow-green-900/40",
                        theme === 'ethereal' && "bg-indigo-600 text-white hover:bg-indigo-700",
                        theme === 'prism' && "bg-slate-800 text-white hover:bg-slate-900",
                        theme === 'minecraft' && "bg-[#545454] text-white hover:bg-[#373737] border-b-4 border-[#1e1e1e]",
                        theme === 'undertale' && "bg-white text-black hover:bg-white/90",
                        theme === 'god-of-war' && "bg-[#8b0000] text-white hover:bg-[#a00000]",
                        theme === 'cuphead' && "bg-black text-white hover:bg-black/90",
                        theme === 'comic' && "bg-black text-white hover:bg-black/90",
                        theme === 'realistic' && "bg-slate-700 text-white hover:bg-slate-800"
                      )}
                    >
                      Sync to Editor
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Preview Panel */}
          <AnimatePresence>
            {parsedData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-8"
              >
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart} 
                  onDragEnd={handleDragEnd}
                >
                  {/* Document View */}
                  <div className={cn(
                    "rounded-xl shadow-xl overflow-hidden flex flex-col border transition-colors duration-500",
                    theme === 'modern' && "bg-white border-slate-200 shadow-slate-200/50",
                    theme === 'professional' && "bg-white border-slate-300 shadow-slate-300/50",
                    theme === 'cyberpunk' && "bg-black border-cyan-900 shadow-cyan-900/20",
                    theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] shadow-[#d4c5a1]/20",
                    theme === 'terminal' && "bg-black border-green-900 shadow-green-900/20",
                    theme === 'ethereal' && "bg-white border-indigo-100 shadow-indigo-100/20",
                    theme === 'prism' && "bg-white border-slate-200 shadow-slate-200/50",
                    theme === 'minecraft' && "bg-[#313131] border-[#1e1e1e] shadow-black/50",
                    theme === 'undertale' && "bg-black border-white/20 shadow-white/5",
                    theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30 shadow-[#8b0000]/10",
                    theme === 'cuphead' && "bg-[#f4e4bc] border-black shadow-black/10",
                    theme === 'comic' && "bg-white border-black shadow-black/10"
                  )} style={{ height: 'calc(100vh - 10rem)' }}>
                    <div className={cn(
                      "px-6 py-3 border-b flex items-center justify-between shrink-0 transition-colors duration-500",
                      theme === 'modern' && "bg-slate-800 border-slate-700",
                      theme === 'professional' && "bg-slate-900 border-slate-800",
                      theme === 'cyberpunk' && "bg-black border-cyan-900",
                      theme === 'vintage' && "bg-[#5c4b37] border-[#8b7355]",
                      theme === 'terminal' && "bg-black border-green-900",
                      theme === 'ethereal' && "bg-indigo-900 border-indigo-800",
                      theme === 'prism' && "bg-slate-900 border-slate-800",
                      theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e]",
                      theme === 'undertale' && "bg-black border-white/20",
                      theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                      theme === 'cuphead' && "bg-black border-black",
                      theme === 'comic' && "bg-black border-black"
                    )}>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "text-xs font-medium tracking-wider uppercase transition-colors duration-500",
                          theme === 'modern' && "text-slate-300",
                          theme === 'professional' && "text-slate-400",
                          theme === 'cyberpunk' && "text-cyan-400",
                          theme === 'vintage' && "text-[#fdfbf7]",
                          theme === 'terminal' && "text-green-500",
                          theme === 'ethereal' && "text-indigo-100",
                          theme === 'prism' && "text-slate-300",
                          theme === 'minecraft' && "text-white",
                          theme === 'undertale' && "text-white",
                          theme === 'god-of-war' && "text-[#e5e5e5]",
                          theme === 'cuphead' && "text-white",
                          theme === 'comic' && "text-white"
                        )}>Document Preview</div>
                      </div>
                      <div className="w-12"></div>
                    </div>
                    
                    <div className={cn(
                      "flex-1 overflow-y-auto custom-scrollbar relative transition-colors duration-500",
                      "p-4 md:p-8",
                      theme === 'modern' && "bg-[#f8f9fa]",
                      theme === 'professional' && "bg-[#f1f5f9]",
                      theme === 'cyberpunk' && "bg-black/80",
                      theme === 'vintage' && "bg-[#f4ecd8]",
                      theme === 'terminal' && "bg-black",
                      theme === 'ethereal' && "bg-indigo-50/30",
                      theme === 'prism' && "bg-slate-50",
                      theme === 'minecraft' && "bg-[#313131]",
                      theme === 'undertale' && "bg-black",
                      theme === 'god-of-war' && "bg-[#1a1a1a]",
                      theme === 'cuphead' && "bg-[#f4e4bc]",
                      theme === 'comic' && "bg-white"
                    )}>
                      <div className={cn(
                        "w-full max-w-5xl mx-auto min-h-full transition-all duration-500",
                        "p-6 md:p-16 shadow-sm border rounded-lg",
                        theme === 'modern' && "bg-white border-slate-100",
                        theme === 'professional' && "bg-white border-slate-200",
                        theme === 'cyberpunk' && "bg-black border-cyan-900/50 shadow-cyan-900/20",
                        theme === 'vintage' && "bg-[#fdfbf7] border-[#e5e1d8] shadow-[inset_0_0_100px_rgba(0,0,0,0.02)]",
                        theme === 'terminal' && "bg-black border-green-900/50 shadow-green-900/20",
                        theme === 'ethereal' && "bg-white border-indigo-50 shadow-indigo-100/10",
                        theme === 'prism' && "bg-[#fdfdfd] border-slate-200 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]",
                        theme === 'minecraft' && "bg-[#313131] border-[#1e1e1e]",
                        theme === 'undertale' && "bg-black border-white/20",
                        theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                        theme === 'cuphead' && "bg-[#fdfbf7] border-black",
                        theme === 'comic' && "bg-white border-black"
                      )}>
                        <div className="document-preview" style={{ fontSize: `${textSize}px`, transition: 'font-size 0.2s ease' }}>
                          <DocumentContext.Provider value={{ fullData: parsedData }}>
                            <DocumentRenderer 
                              data={parsedData} 
                              isDragModeActive={isDragModeActive} 
                              isOrderingMode={isOrderingMode}
                              imagePlacements={imagePlacements} 
                              onZoneClick={(path) => setActiveZonePath(path)}
                              onRemoveImage={handleRemovePlacedImage}
                              onUpdateImage={handleUpdatePlacedImage}
                              onUpdateItem={handleUpdateItem}
                              onReorderGroupClick={setReorderGroupIndex}
                              selectedColors={selectedColors}
                              theme={theme}
                            />
                          </DocumentContext.Provider>
                        </div>
                        
                        {/* Extracted Images Section */}
                        {(extractedImages.length > 0 || isDragModeActive) && (
                          <ExtractedImagesZone active={isDragModeActive} theme={theme}>
                            <h2 className={cn(
                              "text-2xl font-bold mb-6 flex items-center",
                              theme === 'modern' && "text-slate-800",
                              theme === 'professional' && "text-slate-900",
                              theme === 'cyberpunk' && "text-cyan-400",
                              theme === 'vintage' && "text-[#5c4b37]",
                              theme === 'terminal' && "text-green-500",
                              theme === 'ethereal' && "text-indigo-900",
                              theme === 'prism' && "text-slate-800",
                              theme === 'minecraft' && "text-white",
                              theme === 'undertale' && "text-white",
                              theme === 'god-of-war' && "text-[#e5e5e5]",
                              theme === 'cuphead' && "text-black",
                              theme === 'comic' && "text-black"
                            )}>
                              <ImageIcon className={cn(
                                "w-6 h-6 mr-2",
                                theme === 'modern' && "text-purple-500",
                                theme === 'professional' && "text-blue-600",
                                theme === 'cyberpunk' && "text-cyan-400",
                                theme === 'vintage' && "text-[#8b7355]",
                                theme === 'terminal' && "text-green-500",
                                theme === 'ethereal' && "text-indigo-400",
                                theme === 'prism' && "text-slate-500",
                                theme === 'minecraft' && "text-[#545454]",
                                theme === 'undertale' && "text-white",
                                theme === 'god-of-war' && "text-[#8b0000]",
                                theme === 'cuphead' && "text-red-600",
                                theme === 'comic' && "text-blue-500"
                              )} />
                              Extracted Images
                            </h2>
                            {extractedImages.length === 0 && isDragModeActive ? (
                              <div className={cn(
                                "text-center py-8 border-2 border-dashed rounded-xl",
                                theme === 'modern' && "text-slate-400 border-slate-200",
                                theme === 'professional' && "text-slate-500 border-slate-300",
                                theme === 'cyberpunk' && "text-cyan-900 border-cyan-900/50",
                                theme === 'vintage' && "text-[#8b7355] border-[#d4c5a1]",
                                theme === 'terminal' && "text-green-900 border-green-900/50",
                                theme === 'ethereal' && "text-indigo-300 border-indigo-100",
                                theme === 'prism' && "text-slate-400 border-slate-200",
                                theme === 'minecraft' && "text-[#545454] border-[#1e1e1e]",
                                theme === 'undertale' && "text-white/40 border-white/20",
                                theme === 'god-of-war' && "text-[#e5e5e5]/40 border-[#8b0000]/20",
                                theme === 'cuphead' && "text-black/40 border-black/20",
                                theme === 'comic' && "text-black/40 border-black/20"
                              )}>
                                Drop images here to remove them from the document
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-6">
                                {extractedImages.map((img, idx) => (
                                  isDragModeActive ? (
                                    <DraggableImage 
                                      key={img.url} 
                                      id={`img-${idx}`} 
                                      image={img} 
                                      theme={theme}
                                      onUpdate={(updates) => {
                                        setExtractedImages(prev => prev.map((item, i) => i === idx ? { ...item, ...updates } : item));
                                      }}
                                      onRemove={() => {
                                        setExtractedImages(prev => prev.filter((_, i) => i !== idx));
                                      }}
                                    />
                                  ) : (
                                    <div key={idx} className={cn(
                                      "border rounded-lg overflow-hidden shadow-sm flex justify-center",
                                      theme === 'modern' && "border-slate-200 bg-slate-50",
                                      theme === 'professional' && "border-slate-300 bg-slate-100",
                                      theme === 'cyberpunk' && "border-cyan-900 bg-black/40",
                                      theme === 'vintage' && "border-[#d4c5a1] bg-[#f4ecd8]/30",
                                      theme === 'terminal' && "border-green-900 bg-black",
                                      theme === 'ethereal' && "border-indigo-100 bg-white/50",
                                      theme === 'prism' && "border-slate-200 bg-slate-50",
                                      theme === 'minecraft' && "border-[#1e1e1e] bg-[#313131]",
                                      theme === 'undertale' && "border-white/20 bg-black",
                                      theme === 'god-of-war' && "border-[#8b0000]/20 bg-[#1a1a1a]",
                                      theme === 'cuphead' && "border-black bg-[#f4e4bc]",
                                      theme === 'comic' && "border-black bg-white"
                                    )}>
                                      <img src={img.url} alt={`Extracted page ${idx + 1}`} className="max-w-full h-auto object-contain" style={{ maxHeight: '800px' }} />
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </ExtractedImagesZone>
                        )}
                      </div>
                    </div>
                  </div>

                  <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
                    {activeDragUrl ? (
                      <div className="opacity-90 rotate-3 scale-105 transition-transform shadow-2xl rounded-xl overflow-hidden border-4 border-blue-500 bg-white w-48 pointer-events-none">
                        <img 
                          src={activeDragUrl} 
                          alt="Dragging" 
                          className="w-full h-auto object-contain" 
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>

                {/* Image Selector Modal for Tap-to-Place */}
                <AnimatePresence>
                  {activeZonePath && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveZonePath(null)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl rounded-2xl shadow-2xl border overflow-hidden z-[60] flex flex-col max-h-[85vh]",
                          theme === 'modern' && "bg-white border-slate-200",
                          theme === 'professional' && "bg-white border-slate-300",
                          theme === 'cyberpunk' && "bg-[#0a0a0a] border-cyan-900",
                          theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1]",
                          theme === 'terminal' && "bg-black border-green-900",
                          theme === 'ethereal' && "bg-white/90 backdrop-blur-md border-indigo-100",
                          theme === 'prism' && "bg-white border-slate-200",
                          theme === 'minecraft' && "bg-[#313131] border-[#1e1e1e]",
                          theme === 'undertale' && "bg-black border-white",
                          theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]",
                          theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                          theme === 'comic' && "bg-white border-black"
                        )}
                      >
                        <div className={cn(
                          "px-6 py-4 border-b flex items-center justify-between",
                          theme === 'modern' && "bg-slate-50 border-slate-100",
                          theme === 'professional' && "bg-slate-50 border-slate-200",
                          theme === 'cyberpunk' && "bg-black/60 border-cyan-900/50",
                          theme === 'vintage' && "bg-[#f4ecd8] border-[#d4c5a1]",
                          theme === 'terminal' && "bg-black border-green-900/50",
                          theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100",
                          theme === 'prism' && "bg-slate-50 border-slate-100",
                          theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e]",
                          theme === 'undertale' && "bg-black border-white/20",
                          theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                          theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                          theme === 'comic' && "bg-white border-black"
                        )}>
                          <div className="flex items-center">
                            <div className={cn(
                              "p-2 rounded-lg mr-3",
                              theme === 'modern' && "bg-blue-50",
                              theme === 'professional' && "bg-blue-100",
                              theme === 'cyberpunk' && "bg-cyan-950",
                              theme === 'vintage' && "bg-[#8b7355]/20",
                              theme === 'terminal' && "bg-green-950",
                              theme === 'ethereal' && "bg-indigo-100",
                              theme === 'prism' && "bg-slate-100",
                              theme === 'minecraft' && "bg-[#545454]",
                              theme === 'undertale' && "bg-white/10",
                              theme === 'god-of-war' && "bg-[#8b0000]/20",
                              theme === 'cuphead' && "bg-red-100",
                              theme === 'comic' && "bg-blue-100"
                            )}>
                              <ImageIcon className={cn(
                                "w-5 h-5",
                                theme === 'modern' && "text-blue-600",
                                theme === 'professional' && "text-blue-700",
                                theme === 'cyberpunk' && "text-cyan-400",
                                theme === 'vintage' && "text-[#5c4b37]",
                                theme === 'terminal' && "text-green-500",
                                theme === 'ethereal' && "text-indigo-600",
                                theme === 'prism' && "text-slate-600",
                                theme === 'minecraft' && "text-white",
                                theme === 'undertale' && "text-white",
                                theme === 'god-of-war' && "text-[#8b0000]",
                                theme === 'cuphead' && "text-black",
                                theme === 'comic' && "text-black"
                              )} />
                            </div>
                            <div>
                              <h3 className={cn(
                                "font-bold",
                                theme === 'modern' && "text-slate-800",
                                theme === 'professional' && "text-slate-900",
                                theme === 'cyberpunk' && "text-cyan-400",
                                theme === 'vintage' && "text-[#5c4b37]",
                                theme === 'terminal' && "text-green-500",
                                theme === 'ethereal' && "text-indigo-900",
                                theme === 'prism' && "text-slate-800",
                                theme === 'minecraft' && "text-white",
                                theme === 'undertale' && "text-white",
                                theme === 'god-of-war' && "text-[#e5e5e5]",
                                theme === 'cuphead' && "text-black",
                                theme === 'comic' && "text-black"
                              )}>Place Image</h3>
                              <p className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                theme === 'modern' && "text-slate-400",
                                theme === 'professional' && "text-slate-500",
                                theme === 'cyberpunk' && "text-cyan-900",
                                theme === 'vintage' && "text-[#8b7355]",
                                theme === 'terminal' && "text-green-900",
                                theme === 'ethereal' && "text-indigo-300",
                                theme === 'prism' && "text-slate-400",
                                theme === 'minecraft' && "text-[#545454]",
                                theme === 'undertale' && "text-white/40",
                                theme === 'god-of-war' && "text-[#e5e5e5]/40",
                                theme === 'cuphead' && "text-black/60",
                                theme === 'comic' && "text-black/60"
                              )}>Choose source or enter URL</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveZonePath(null)}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              theme === 'modern' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                              theme === 'professional' && "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
                              theme === 'cyberpunk' && "text-cyan-900 hover:text-cyan-400 hover:bg-cyan-900/30",
                              theme === 'vintage' && "text-[#8b7355] hover:text-[#5c4b37] hover:bg-[#d4c5a1]",
                              theme === 'terminal' && "text-green-900 hover:text-green-500 hover:bg-green-900/30",
                              theme === 'ethereal' && "text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50",
                              theme === 'prism' && "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                              theme === 'minecraft' && "text-[#545454] hover:text-white hover:bg-[#545454]",
                              theme === 'undertale' && "text-white/40 hover:text-white hover:bg-white/10",
                              theme === 'god-of-war' && "text-[#e5e5e5]/40 hover:text-white hover:bg-[#8b0000]/20",
                              theme === 'cuphead' && "text-black/40 hover:text-black hover:bg-black/10",
                              theme === 'comic' && "text-black/40 hover:text-black hover:bg-black/10"
                            )}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className={cn(
                          "p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar",
                          theme === 'modern' && "bg-slate-50",
                          theme === 'professional' && "bg-slate-50",
                          theme === 'cyberpunk' && "bg-black/40",
                          theme === 'vintage' && "bg-[#f4ecd8]/30",
                          theme === 'terminal' && "bg-black",
                          theme === 'ethereal' && "bg-indigo-50/10",
                          theme === 'prism' && "bg-slate-50",
                          theme === 'minecraft' && "bg-[#313131]",
                          theme === 'undertale' && "bg-black",
                          theme === 'god-of-war' && "bg-[#1a1a1a]",
                          theme === 'cuphead' && "bg-[#f4e4bc]",
                          theme === 'comic' && "bg-white"
                        )}>
                          {/* Image Upload Option */}
                          <div className={cn(
                            "p-5 rounded-2xl border shadow-sm",
                            theme === 'modern' && "bg-white border-slate-200",
                            theme === 'professional' && "bg-white border-slate-300",
                            theme === 'cyberpunk' && "bg-black/60 border-cyan-900/50",
                            theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1]",
                            theme === 'terminal' && "bg-black border-green-900/50",
                            theme === 'ethereal' && "bg-white border-indigo-100",
                            theme === 'prism' && "bg-white border-slate-200",
                            theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e]",
                            theme === 'undertale' && "bg-black border-white/20",
                            theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                            theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                            theme === 'comic' && "bg-white border-black"
                          )}>
                            <h4 className={cn(
                              "text-xs font-bold uppercase tracking-widest mb-4 flex items-center",
                              theme === 'modern' && "text-slate-500",
                              theme === 'professional' && "text-slate-600",
                              theme === 'cyberpunk' && "text-cyan-600",
                              theme === 'vintage' && "text-[#8b7355]",
                              theme === 'terminal' && "text-green-700",
                              theme === 'ethereal' && "text-indigo-400",
                              theme === 'prism' && "text-slate-500",
                              theme === 'minecraft' && "text-[#545454]",
                              theme === 'undertale' && "text-white/40",
                              theme === 'god-of-war' && "text-[#e5e5e5]/40",
                              theme === 'cuphead' && "text-black/60",
                              theme === 'comic' && "text-black/60"
                            )}>
                              <Upload className={cn(
                                "w-4 h-4 mr-2",
                                theme === 'modern' && "text-emerald-500",
                                theme === 'professional' && "text-emerald-600",
                                theme === 'cyberpunk' && "text-cyan-400",
                                theme === 'vintage' && "text-[#8b7355]",
                                theme === 'terminal' && "text-green-500",
                                theme === 'ethereal' && "text-indigo-400",
                                theme === 'prism' && "text-slate-400",
                                theme === 'minecraft' && "text-[#545454]",
                                theme === 'undertale' && "text-white",
                                theme === 'god-of-war' && "text-[#8b0000]",
                                theme === 'cuphead' && "text-red-600",
                                theme === 'comic' && "text-blue-500"
                              )} />
                              Upload Image File
                            </h4>
                            <label className={cn(
                              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                              theme === 'modern' && "border-slate-200 hover:bg-slate-50 hover:border-emerald-400",
                              theme === 'professional' && "border-slate-300 hover:bg-slate-100 hover:border-emerald-500",
                              theme === 'cyberpunk' && "border-cyan-900/50 hover:bg-cyan-900/20 hover:border-cyan-400",
                              theme === 'vintage' && "border-[#d4c5a1] hover:bg-[#f4ecd8] hover:border-[#5c4b37]",
                              theme === 'terminal' && "border-green-900/50 hover:bg-green-900/20 hover:border-green-500",
                              theme === 'ethereal' && "border-indigo-100 hover:bg-indigo-50 hover:border-indigo-400",
                              theme === 'prism' && "border-slate-200 hover:bg-slate-50 hover:border-slate-400",
                              theme === 'minecraft' && "border-[#1e1e1e] hover:bg-[#545454] hover:border-white",
                              theme === 'undertale' && "border-white/20 hover:bg-white/10 hover:border-white",
                              theme === 'god-of-war' && "border-[#8b0000]/20 hover:bg-[#8b0000]/10 hover:border-[#8b0000]",
                              theme === 'cuphead' && "border-black/20 hover:bg-black/5 hover:border-black",
                              theme === 'comic' && "border-black/20 hover:bg-black/5 hover:border-black"
                            )}>
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Plus className={cn(
                                  "w-8 h-8 mb-2",
                                  theme === 'modern' && "text-slate-300",
                                  theme === 'professional' && "text-slate-400",
                                  theme === 'cyberpunk' && "text-cyan-900",
                                  theme === 'vintage' && "text-[#d4c5a1]",
                                  theme === 'terminal' && "text-green-900",
                                  theme === 'ethereal' && "text-indigo-200",
                                  theme === 'prism' && "text-slate-300",
                                  theme === 'minecraft' && "text-[#545454]",
                                  theme === 'undertale' && "text-white/20",
                                  theme === 'god-of-war' && "text-[#8b0000]/20",
                                  theme === 'cuphead' && "text-black/20",
                                  theme === 'comic' && "text-black/20"
                                )} />
                                <p className={cn(
                                  "text-sm font-medium",
                                  theme === 'modern' && "text-slate-500",
                                  theme === 'professional' && "text-slate-600",
                                  theme === 'cyberpunk' && "text-cyan-400",
                                  theme === 'vintage' && "text-[#5c4b37]",
                                  theme === 'terminal' && "text-green-500",
                                  theme === 'ethereal' && "text-indigo-900",
                                  theme === 'prism' && "text-slate-600",
                                  theme === 'minecraft' && "text-white",
                                  theme === 'undertale' && "text-white",
                                  theme === 'god-of-war' && "text-[#e5e5e5]",
                                  theme === 'cuphead' && "text-black",
                                  theme === 'comic' && "text-black"
                                )}>Click to upload image</p>
                                <p className={cn(
                                  "text-[10px] mt-1 uppercase tracking-wider",
                                  theme === 'modern' && "text-slate-400",
                                  theme === 'professional' && "text-slate-500",
                                  theme === 'cyberpunk' && "text-cyan-900",
                                  theme === 'vintage' && "text-[#8b7355]",
                                  theme === 'terminal' && "text-green-900",
                                  theme === 'ethereal' && "text-indigo-300",
                                  theme === 'prism' && "text-slate-400",
                                  theme === 'minecraft' && "text-[#545454]",
                                  theme === 'undertale' && "text-white/40",
                                  theme === 'god-of-war' && "text-[#e5e5e5]/40",
                                  theme === 'cuphead' && "text-black/60",
                                  theme === 'comic' && "text-black/60"
                                )}>PNG, JPG, WEBP</p>
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                          </div>

                          {/* Manual URL Input - "To Type" */}
                          <div className={cn(
                            "p-5 rounded-2xl border shadow-sm",
                            theme === 'modern' && "bg-white border-slate-200",
                            theme === 'professional' && "bg-white border-slate-300",
                            theme === 'cyberpunk' && "bg-black/60 border-cyan-900/50",
                            theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1]",
                            theme === 'terminal' && "bg-black border-green-900/50",
                            theme === 'ethereal' && "bg-white border-indigo-100",
                            theme === 'prism' && "bg-white border-slate-200",
                            theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e]",
                            theme === 'undertale' && "bg-black border-white/20",
                            theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                            theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                            theme === 'comic' && "bg-white border-black"
                          )}>
                            <h4 className={cn(
                              "text-xs font-bold uppercase tracking-widest mb-4 flex items-center",
                              theme === 'modern' && "text-slate-500",
                              theme === 'professional' && "text-slate-600",
                              theme === 'cyberpunk' && "text-cyan-600",
                              theme === 'vintage' && "text-[#8b7355]",
                              theme === 'terminal' && "text-green-700",
                              theme === 'ethereal' && "text-indigo-400",
                              theme === 'prism' && "text-slate-500",
                              theme === 'minecraft' && "text-[#545454]",
                              theme === 'undertale' && "text-white/40",
                              theme === 'god-of-war' && "text-[#e5e5e5]/40",
                              theme === 'cuphead' && "text-black/60",
                              theme === 'comic' && "text-black/60"
                            )}>
                              <Type className={cn(
                                "w-4 h-4 mr-2",
                                theme === 'modern' && "text-blue-500",
                                theme === 'professional' && "text-blue-600",
                                theme === 'cyberpunk' && "text-cyan-400",
                                theme === 'vintage' && "text-[#8b7355]",
                                theme === 'terminal' && "text-green-500",
                                theme === 'ethereal' && "text-indigo-400",
                                theme === 'prism' && "text-slate-400",
                                theme === 'minecraft' && "text-[#545454]",
                                theme === 'undertale' && "text-white",
                                theme === 'god-of-war' && "text-[#8b0000]",
                                theme === 'cuphead' && "text-red-600",
                                theme === 'comic' && "text-blue-500"
                              )} />
                              Enter Image URL
                            </h4>
                            <div className="flex gap-3">
                              <input 
                                type="text"
                                placeholder="https://example.com/image.png"
                                className={cn(
                                  "flex-1 px-4 py-3 border-2 rounded-xl outline-none transition-all text-sm font-medium",
                                  theme === 'modern' && "bg-slate-50 border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500",
                                  theme === 'professional' && "bg-slate-50 border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600",
                                  theme === 'cyberpunk' && "bg-black border-cyan-900 focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-400 text-cyan-400",
                                  theme === 'vintage' && "bg-[#f4ecd8] border-[#d4c5a1] focus:ring-4 focus:ring-[#5c4b37]/10 focus:border-[#5c4b37] text-[#5c4b37]",
                                  theme === 'terminal' && "bg-black border-green-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 text-green-500",
                                  theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 text-indigo-900",
                                  theme === 'prism' && "bg-slate-50 border-slate-100 focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 text-slate-800",
                                  theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e] focus:border-white text-white",
                                  theme === 'undertale' && "bg-black border-white/20 focus:border-white text-white",
                                  theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30 focus:border-[#8b0000] text-[#e5e5e5]",
                                  theme === 'cuphead' && "bg-[#f4e4bc] border-black focus:ring-4 focus:ring-black/10 focus:border-black text-black",
                                  theme === 'comic' && "bg-white border-black focus:ring-4 focus:ring-black/10 focus:border-black text-black"
                                )}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value) {
                                    const url = e.currentTarget.value;
                                    const targetItem = activeZonePath ? getItemByPath(activeZonePath) : null;
                                    const isImgBlock = targetItem && targetItem.TYPE === 'IMG';

                                    setPendingImage({ url, path: activeZonePath });
                                    setPendingImageSettings({
                                      url,
                                      width: isImgBlock ? 100 : (activeZonePath ? 25 : 100),
                                      alignment: isImgBlock ? 'center' : (activeZonePath ? 'right' : 'center'),
                                      hasBorder: false,
                                      caption: ''
                                    });
                                  }
                                }}
                                id="manual-url-input"
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById('manual-url-input') as HTMLInputElement;
                                  if (input && input.value) {
                                    const url = input.value;
                                    const targetItem = activeZonePath ? getItemByPath(activeZonePath) : null;
                                    const isImgBlock = targetItem && targetItem.TYPE === 'IMG';

                                    setPendingImage({ url, path: activeZonePath });
                                    setPendingImageSettings({
                                      url,
                                      width: isImgBlock ? 100 : (activeZonePath ? 25 : 100),
                                      alignment: isImgBlock ? 'center' : (activeZonePath ? 'right' : 'center'),
                                      hasBorder: false,
                                      caption: ''
                                    });
                                  }
                                }}
                                className={cn(
                                  "px-6 py-3 font-bold rounded-xl transition-all active:scale-95 shadow-lg",
                                  theme === 'modern' && "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100",
                                  theme === 'professional' && "bg-blue-700 text-white hover:bg-blue-800 shadow-blue-200",
                                  theme === 'cyberpunk' && "bg-cyan-600 text-black hover:bg-cyan-400 shadow-cyan-900/40",
                                  theme === 'vintage' && "bg-[#5c4b37] text-[#fdfbf7] hover:bg-[#8b7355] shadow-[#5c4b37]/20",
                                  theme === 'terminal' && "bg-green-600 text-black hover:bg-green-500 shadow-green-900/40",
                                  theme === 'ethereal' && "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100",
                                  theme === 'prism' && "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200",
                                  theme === 'minecraft' && "bg-[#545454] text-white hover:bg-[#373737] border-b-4 border-[#1e1e1e]",
                                  theme === 'undertale' && "bg-white text-black hover:bg-white/90",
                                  theme === 'god-of-war' && "bg-[#8b0000] text-white hover:bg-[#a00000] shadow-[#8b0000]/40",
                                  theme === 'cuphead' && "bg-black text-white hover:bg-black/90",
                                  theme === 'comic' && "bg-black text-white hover:bg-black/90"
                                )}
                              >
                                Add
                              </button>
                            </div>
                            <p className={cn(
                              "text-[10px] mt-3 italic",
                              theme === 'modern' && "text-slate-400",
                              theme === 'professional' && "text-slate-500",
                              theme === 'cyberpunk' && "text-cyan-900",
                              theme === 'vintage' && "text-[#8b7355]",
                              theme === 'terminal' && "text-green-900",
                              theme === 'ethereal' && "text-indigo-300",
                              theme === 'prism' && "text-slate-400",
                              theme === 'minecraft' && "text-[#545454]",
                              theme === 'undertale' && "text-white/40",
                              theme === 'god-of-war' && "text-[#e5e5e5]/40",
                              theme === 'cuphead' && "text-black/60",
                              theme === 'comic' && "text-black/60"
                            )}>Paste any image link from the web to include it in your document.</p>
                          </div>

                          {/* Extracted Images */}
                          <div>
                            <h4 className={cn(
                              "text-xs font-bold uppercase tracking-widest mb-4 flex items-center",
                              theme === 'modern' && "text-slate-500",
                              theme === 'professional' && "text-slate-600",
                              theme === 'cyberpunk' && "text-cyan-600",
                              theme === 'vintage' && "text-[#8b7355]",
                              theme === 'terminal' && "text-green-700",
                              theme === 'ethereal' && "text-indigo-400",
                              theme === 'prism' && "text-slate-500",
                              theme === 'minecraft' && "text-[#545454]",
                              theme === 'undertale' && "text-white/40",
                              theme === 'god-of-war' && "text-[#e5e5e5]/40",
                              theme === 'cuphead' && "text-black/60",
                              theme === 'comic' && "text-black/60"
                            )}>
                              <ImageIcon className={cn(
                                "w-4 h-4 mr-2",
                                theme === 'modern' && "text-purple-500",
                                theme === 'professional' && "text-purple-600",
                                theme === 'cyberpunk' && "text-cyan-400",
                                theme === 'vintage' && "text-[#8b7355]",
                                theme === 'terminal' && "text-green-500",
                                theme === 'ethereal' && "text-indigo-400",
                                theme === 'prism' && "text-slate-400",
                                theme === 'minecraft' && "text-[#545454]",
                                theme === 'undertale' && "text-white",
                                theme === 'god-of-war' && "text-[#8b0000]",
                                theme === 'cuphead' && "text-red-600",
                                theme === 'comic' && "text-blue-500"
                              )} />
                              From Extracted Images
                            </h4>
                            {extractedImages.length === 0 ? (
                              <div className={cn(
                                "text-center py-12 rounded-2xl border border-dashed",
                                theme === 'modern' && "bg-white border-slate-200 text-slate-400",
                                theme === 'professional' && "bg-white border-slate-300 text-slate-500",
                                theme === 'cyberpunk' && "bg-black/60 border-cyan-900/50 text-cyan-900",
                                theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] text-[#8b7355]",
                                theme === 'terminal' && "bg-black border-green-900/50 text-green-900",
                                theme === 'ethereal' && "bg-white border-indigo-100 text-indigo-300",
                                theme === 'prism' && "bg-white border-slate-200 text-slate-400",
                                theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e] text-[#545454]",
                                theme === 'undertale' && "bg-black border-white/20 text-white/40",
                                theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30 text-[#e5e5e5]/40",
                                theme === 'cuphead' && "bg-[#f4e4bc] border-black text-black/40",
                                theme === 'comic' && "bg-white border-black text-black/40"
                              )}>
                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No extracted images available.</p>
                                <p className="text-[10px] mt-1 mb-4">Upload a PDF in settings to see images here.</p>
                                <button 
                                  onClick={() => {
                                    setActiveSettingsSection('import-export');
                                    setIsSettingsOpen(true);
                                  }}
                                  className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest flex items-center justify-center mx-auto transition-colors",
                                    theme === 'modern' && "text-purple-600 hover:text-purple-700",
                                    theme === 'professional' && "text-purple-700 hover:text-purple-800",
                                    theme === 'cyberpunk' && "text-cyan-400 hover:text-cyan-300",
                                    theme === 'vintage' && "text-[#5c4b37] hover:text-[#8b7355]",
                                    theme === 'terminal' && "text-green-500 hover:text-green-400",
                                    theme === 'ethereal' && "text-indigo-600 hover:text-indigo-700",
                                    theme === 'prism' && "text-slate-800 hover:text-slate-900",
                                    theme === 'minecraft' && "text-white hover:text-[#545454]",
                                    theme === 'undertale' && "text-white hover:text-white/80",
                                    theme === 'god-of-war' && "text-[#8b0000] hover:text-[#a00000]",
                                    theme === 'cuphead' && "text-black hover:text-black/80",
                                    theme === 'comic' && "text-black hover:text-black/80"
                                  )}
                                >
                                  <UploadCloud className="w-3 h-3 mr-1" />
                                  Import Photos from PDF
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {extractedImages.map((img, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const path = activeZonePath;
                                      if (!path) return;
                                      setPendingImage({ url: img.url, path });
                                      setPendingImageSettings({
                                        ...img,
                                        width: 25,
                                        alignment: 'right'
                                      });
                                    }}
                                    className={cn(
                                      "relative group border-2 overflow-hidden shadow-sm transition-all focus:outline-none focus:ring-4",
                                      theme === 'modern' && "bg-white border-slate-200 hover:border-blue-500 focus:ring-blue-500/20 rounded-xl",
                                      theme === 'professional' && "bg-white border-slate-300 hover:border-slate-500 focus:ring-slate-900/10 rounded-lg",
                                      theme === 'cyberpunk' && "bg-black border-cyan-900/50 hover:border-cyan-400 focus:ring-cyan-500/20 rounded-none",
                                      theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] hover:border-[#5c4b37] focus:ring-[#5c4b37]/10 rounded-none",
                                      theme === 'terminal' && "bg-black border-green-900/50 hover:border-green-500 focus:ring-green-500/20 rounded-none",
                                      theme === 'ethereal' && "bg-white border-indigo-100 hover:border-indigo-400 focus:ring-indigo-500/10 rounded-2xl",
                                      theme === 'prism' && "bg-white border-slate-200 hover:border-indigo-400 focus:ring-indigo-500/20 rounded-2xl",
                                      theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e] hover:border-white focus:border-white rounded-none",
                                      theme === 'undertale' && "bg-black border-white/20 hover:border-white focus:border-white rounded-none",
                                      theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30 hover:border-[#8b0000] focus:border-[#8b0000] rounded-none",
                                      theme === 'cuphead' && "bg-[#f4e4bc] border-black hover:bg-white focus:bg-white rounded-none",
                                      theme === 'comic' && "bg-white border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute inset-0 transition-colors z-10 flex items-center justify-center",
                                      theme === 'modern' && "bg-blue-500/0 group-hover:bg-blue-500/10",
                                      theme === 'professional' && "bg-slate-900/0 group-hover:bg-slate-900/5",
                                      theme === 'cyberpunk' && "bg-cyan-400/0 group-hover:bg-cyan-400/10",
                                      theme === 'vintage' && "bg-[#5c4b37]/0 group-hover:bg-[#5c4b37]/5",
                                      theme === 'terminal' && "bg-green-500/0 group-hover:bg-green-500/10",
                                      theme === 'ethereal' && "bg-indigo-600/0 group-hover:bg-indigo-600/5",
                                      theme === 'prism' && "bg-indigo-500/0 group-hover:bg-indigo-500/10",
                                      theme === 'minecraft' && "bg-white/0 group-hover:bg-white/5",
                                      theme === 'undertale' && "bg-white/0 group-hover:bg-white/10",
                                      theme === 'god-of-war' && "bg-[#8b0000]/0 group-hover:bg-[#8b0000]/10",
                                      theme === 'cuphead' && "bg-black/0 group-hover:bg-black/5",
                                      theme === 'comic' && "bg-black/0 group-hover:bg-black/5"
                                    )}>
                                      <Plus className={cn(
                                        "w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md",
                                        theme === 'modern' && "text-blue-600",
                                        theme === 'professional' && "text-slate-900",
                                        theme === 'cyberpunk' && "text-cyan-400",
                                        theme === 'vintage' && "text-[#5c4b37]",
                                        theme === 'terminal' && "text-green-500",
                                        theme === 'ethereal' && "text-indigo-600",
                                        theme === 'prism' && "text-indigo-500",
                                        theme === 'minecraft' && "text-white",
                                        theme === 'undertale' && "text-white",
                                        theme === 'god-of-war' && "text-[#8b0000]",
                                        theme === 'cuphead' && "text-black",
                                        theme === 'comic' && "text-black"
                                      )} />
                                    </div>
                                    <img src={img.url} alt={`Selectable ${idx}`} className="w-full h-32 object-contain p-2" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "p-4 border-t flex justify-end",
                          theme === 'modern' && "bg-white border-slate-100",
                          theme === 'professional' && "bg-white border-slate-200",
                          theme === 'cyberpunk' && "bg-black border-cyan-900/50",
                          theme === 'vintage' && "bg-[#f4ecd8] border-[#d4c5a1]",
                          theme === 'terminal' && "bg-black border-green-900/50",
                          theme === 'ethereal' && "bg-white/50 border-indigo-100",
                          theme === 'prism' && "bg-white border-slate-100",
                          theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e]",
                          theme === 'undertale' && "bg-black border-white/20",
                          theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                          theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                          theme === 'comic' && "bg-white border-black"
                        )}>
                          <button
                            onClick={() => setActiveZonePath(null)}
                            className={cn(
                              "px-8 py-3 font-bold transition-all active:scale-95",
                              theme === 'modern' && "bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200",
                              theme === 'professional' && "bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200",
                              theme === 'cyberpunk' && "bg-black border border-cyan-900 text-cyan-400 rounded-xl hover:bg-cyan-900/20",
                              theme === 'vintage' && "bg-[#fdfbf7] border-2 border-[#4a3728] text-[#4a3728] rounded-none hover:bg-[#4a3728]/10",
                              theme === 'terminal' && "bg-black border border-green-900 text-green-500 rounded-xl hover:bg-green-900/20",
                              theme === 'ethereal' && "bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100",
                              theme === 'prism' && "bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200",
                              theme === 'minecraft' && "bg-[#545454] text-white border-b-4 border-black rounded-none hover:bg-[#373737]",
                              theme === 'undertale' && "bg-black border-2 border-white text-white rounded-none hover:bg-white/10",
                              theme === 'god-of-war' && "bg-[#1a1a1a] border border-red-600 text-red-600 rounded-none hover:bg-red-600 hover:text-white",
                              theme === 'cuphead' && "bg-transparent border-2 border-black text-black rounded-none hover:bg-black/10",
                              theme === 'comic' && "bg-transparent border-2 border-black text-black rounded-none hover:bg-black/10"
                            )}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Floating Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={cn(
                    "fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center z-[10010] transition-all",
                    theme === 'modern' && "bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1",
                    theme === 'professional' && "bg-slate-800 text-white shadow-md hover:bg-slate-900 hover:shadow-lg hover:-translate-y-1",
                    theme === 'cyberpunk' && "bg-black border-2 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-950 hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] hover:-translate-y-1 rounded-none",
                    theme === 'vintage' && "bg-[#8b4513] text-[#fdfbf7] border-2 border-[#d4c5a1] shadow-lg hover:bg-[#5d4037] hover:shadow-xl hover:-translate-y-1 rounded-sm",
                    theme === 'terminal' && "bg-black border-2 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-900/30 hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:-translate-y-1 rounded-none",
                    theme === 'ethereal' && "bg-indigo-500 text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] hover:bg-indigo-600 hover:shadow-[0_8px_32px_rgba(99,102,241,0.5)] hover:-translate-y-1",
                    theme === 'prism' && "bg-white text-blue-600 shadow-xl hover:shadow-2xl hover:-translate-y-1",
                    theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] text-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0] rounded-none",
                    theme === 'undertale' && "bg-black border-4 border-white text-white hover:text-yellow-400 hover:border-yellow-400 rounded-none",
                    theme === 'god-of-war' && "bg-[#8b0000] border-2 border-[#ffd700] text-[#ffd700] shadow-[0_0_20px_rgba(139,0,0,0.5)] hover:bg-[#600000] hover:shadow-[0_0_30px_rgba(139,0,0,0.8)] hover:-translate-y-1 rounded-none",
                    theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black text-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-[#e8e8d0] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 rounded-none",
                    theme === 'comic' && "bg-yellow-400 border-4 border-black text-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-yellow-300 hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 rounded-none transform rotate-3"
                  )}
                  aria-label="Settings"
                >
                  <GameIcon name="Settings" theme={theme} className="w-6 h-6" />
                </button>

                {/* Settings Menu Popup */}
                <AnimatePresence>
                  {isSettingsOpen && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSettingsOpen(false)}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[10010]"
                      />
                      
                      {/* Menu Panel */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                          "fixed bottom-24 right-8 w-80 sm:w-96 overflow-hidden z-[10020] flex flex-col",
                          theme === 'modern' && "bg-white rounded-2xl shadow-2xl border border-slate-200",
                          theme === 'professional' && "bg-white rounded-xl shadow-xl border border-slate-300",
                          theme === 'cyberpunk' && "bg-black/90 backdrop-blur-md rounded-none border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]",
                          theme === 'vintage' && "bg-[#fdfbf7] rounded-sm border-4 border-double border-[#8b4513] shadow-xl",
                          theme === 'terminal' && "bg-black rounded-none border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
                          theme === 'ethereal' && "bg-white/80 backdrop-blur-xl rounded-[2rem] border border-indigo-100 shadow-[0_8px_32px_rgba(99,102,241,0.1)]",
                          theme === 'prism' && "bg-white rounded-3xl shadow-2xl border-none",
                          theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
                          theme === 'undertale' && "bg-black rounded-none border-4 border-white",
                          theme === 'god-of-war' && "bg-[#1a1a1a] rounded-none border-2 border-[#ffd700] shadow-[0_10px_30px_rgba(0,0,0,0.8)]",
                          theme === 'cuphead' && "bg-[#f5f5dc] rounded-none border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
                          theme === 'comic' && "bg-white rounded-none border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]"
                        )}
                      >
                        <div className={cn(
                          "px-6 py-4 flex items-center justify-between",
                          theme === 'modern' && "border-b border-slate-100 bg-slate-50",
                          theme === 'professional' && "border-b border-slate-200 bg-slate-100",
                          theme === 'cyberpunk' && "border-b border-cyan-500/50 bg-cyan-950/30",
                          theme === 'vintage' && "border-b-2 border-[#8b4513] bg-[#f4ecd8]",
                          theme === 'terminal' && "border-b border-green-500/50 bg-green-900/20",
                          theme === 'ethereal' && "border-b border-indigo-50 bg-indigo-50/50",
                          theme === 'prism' && "border-b border-slate-100 bg-slate-50/50",
                          theme === 'minecraft' && "border-b-4 border-[#373737] bg-[#8b8b8b]",
                          theme === 'undertale' && "border-b-2 border-white bg-black",
                          theme === 'god-of-war' && "border-b-2 border-[#8b0000] bg-[#2a2a2a]",
                          theme === 'cuphead' && "border-b-4 border-black bg-[#e8e8d0]",
                          theme === 'comic' && "border-b-4 border-black bg-yellow-400"
                        )}>
                          <h3 className={cn(
                            "flex items-center",
                            theme === 'modern' && "font-bold text-slate-800",
                            theme === 'professional' && "font-serif font-bold text-slate-900",
                            theme === 'cyberpunk' && "font-mono font-bold text-cyan-400 uppercase tracking-widest",
                            theme === 'vintage' && "font-serif font-bold text-[#4a3728] italic",
                            theme === 'terminal' && "font-mono font-bold text-green-500 uppercase",
                            theme === 'ethereal' && "font-serif font-bold text-indigo-900",
                            theme === 'prism' && "font-black text-slate-800 tracking-tight",
                            theme === 'minecraft' && "font-pixel text-white drop-shadow-[2px_2px_0_#373737]",
                            theme === 'undertale' && "font-retro text-yellow-400 tracking-widest",
                            theme === 'god-of-war' && "font-serif font-bold text-[#ffd700] uppercase tracking-[0.2em]",
                            theme === 'cuphead' && "font-black text-black uppercase tracking-tighter",
                            theme === 'comic' && "font-black text-black uppercase tracking-tighter italic"
                          )}>
                            <GameIcon name="Settings" theme={theme} className={cn(
                              "w-5 h-5 mr-2",
                              theme === 'modern' && "text-blue-500",
                              theme === 'professional' && "text-slate-700",
                              theme === 'cyberpunk' && "text-cyan-400",
                              theme === 'vintage' && "text-[#8b4513]",
                              theme === 'terminal' && "text-green-500",
                              theme === 'ethereal' && "text-indigo-500",
                              theme === 'prism' && "text-blue-600",
                              theme === 'minecraft' && "text-white",
                              theme === 'undertale' && "text-white",
                              theme === 'god-of-war' && "text-[#ffd700]",
                              theme === 'cuphead' && "text-black",
                              theme === 'comic' && "text-black"
                            )} />
                            Document Settings
                          </h3>
                          <button 
                            onClick={() => setIsSettingsOpen(false)}
                            className={cn(
                              "p-1 rounded-full transition-colors",
                              theme === 'modern' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                              theme === 'professional' && "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
                              theme === 'cyberpunk' && "text-cyan-600 hover:text-cyan-400 hover:bg-cyan-900/50",
                              theme === 'vintage' && "text-[#8b4513]/60 hover:text-[#8b4513] hover:bg-[#8b4513]/10",
                              theme === 'terminal' && "text-green-700 hover:text-green-400 hover:bg-green-900/50",
                              theme === 'ethereal' && "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100",
                              theme === 'prism' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                              theme === 'minecraft' && "text-[#373737] hover:text-white hover:bg-[#373737] rounded-none",
                              theme === 'undertale' && "text-white/50 hover:text-white hover:bg-white/20 rounded-none",
                              theme === 'god-of-war' && "text-[#ffd700]/50 hover:text-[#ffd700] hover:bg-[#8b0000]/50 rounded-none",
                              theme === 'cuphead' && "text-black/50 hover:text-black hover:bg-black/10 rounded-none",
                              theme === 'comic' && "text-black/50 hover:text-black hover:bg-black/10 rounded-none"
                            )}
                          >
                            <GameIcon name="X" theme={theme} className="w-5 h-5" />
                          </button>
                        </div>
                        
                        
                        <div className={cn(
                          "p-4 overflow-y-auto max-h-[75vh] custom-scrollbar space-y-2",
                          theme === 'modern' && "bg-white",
                          theme === 'professional' && "bg-white",
                          theme === 'cyberpunk' && "bg-black/80",
                          theme === 'vintage' && "bg-[#fdfbf7]",
                          theme === 'terminal' && "bg-black",
                          theme === 'ethereal' && "bg-white/50",
                          theme === 'prism' && "bg-white",
                          theme === 'minecraft' && "bg-[#c6c6c6]",
                          theme === 'undertale' && "bg-black",
                          theme === 'god-of-war' && "bg-[#1a1a1a]",
                          theme === 'cuphead' && "bg-[#f5f5dc]",
                          theme === 'comic' && "bg-white"
                        )}>
                          {renderAccordionSection('appearance', 'Appearance', Palette, (
                            <div className="space-y-6">
                              {/* Text Size Slider */}
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800 font-serif",
                                    theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                    theme === 'vintage' && "text-[#4a3728] font-serif",
                                    theme === 'terminal' && "text-green-500 font-mono",
                                    theme === 'ethereal' && "text-indigo-900 font-serif",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase",
                                    theme === 'cuphead' && "text-black font-black uppercase",
                                    theme === 'comic' && "text-black font-black uppercase italic"
                                  )}>
                                    <Type className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-slate-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Text Size
                                  </label>
                                  <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-md",
                                    theme === 'modern' && "text-slate-500 bg-slate-100",
                                    theme === 'professional' && "text-slate-600 bg-slate-200",
                                    theme === 'cyberpunk' && "text-cyan-300 bg-cyan-900/50 border border-cyan-500/30",
                                    theme === 'vintage' && "text-[#4a3728] bg-[#e6d5b8] border border-[#d4c5a1]",
                                    theme === 'terminal' && "text-green-400 bg-green-900/30 border border-green-500/30",
                                    theme === 'ethereal' && "text-indigo-600 bg-indigo-100/50",
                                    theme === 'prism' && "text-slate-600 bg-slate-100",
                                    theme === 'minecraft' && "text-white bg-[#373737] font-pixel text-[8px] border-2 border-[#1a1a1a]",
                                    theme === 'undertale' && "text-yellow-400 bg-white/10 font-retro border border-white/20",
                                    theme === 'god-of-war' && "text-[#ffd700] bg-[#8b0000]/30 font-serif border border-[#8b0000]",
                                    theme === 'cuphead' && "text-black bg-[#e8e8d0] font-black border-2 border-black",
                                    theme === 'comic' && "text-black bg-yellow-200 font-black border-2 border-black"
                                  )}>{textSize}px</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="12" 
                                  max="32" 
                                  step="1"
                                  value={textSize}
                                  onChange={(e) => setTextSize(Number(e.target.value))}
                                  className={cn(
                                    "w-full h-2 rounded-lg appearance-none cursor-pointer",
                                    theme === 'modern' && "bg-slate-200 accent-blue-600",
                                    theme === 'professional' && "bg-slate-300 accent-slate-800",
                                    theme === 'cyberpunk' && "bg-cyan-950 accent-cyan-400",
                                    theme === 'vintage' && "bg-[#e6d5b8] accent-[#8b4513]",
                                    theme === 'terminal' && "bg-green-950 accent-green-500",
                                    theme === 'ethereal' && "bg-indigo-100 accent-indigo-500",
                                    theme === 'prism' && "bg-slate-200 accent-blue-600",
                                    theme === 'minecraft' && "bg-[#373737] accent-[#55ff55] rounded-none",
                                    theme === 'undertale' && "bg-white/20 accent-yellow-400 rounded-none",
                                    theme === 'god-of-war' && "bg-[#2a2a2a] accent-[#ffd700] rounded-none",
                                    theme === 'cuphead' && "bg-[#e8e8d0] accent-black border-2 border-black rounded-none",
                                    theme === 'comic' && "bg-yellow-100 accent-black border-2 border-black rounded-none"
                                  )}
                                />
                                <div className={cn(
                                  "flex justify-between text-xs mt-2 font-medium",
                                  theme === 'modern' && "text-slate-400",
                                  theme === 'professional' && "text-slate-500",
                                  theme === 'cyberpunk' && "text-cyan-600",
                                  theme === 'vintage' && "text-[#8b4513]/60",
                                  theme === 'terminal' && "text-green-700",
                                  theme === 'ethereal' && "text-indigo-400",
                                  theme === 'prism' && "text-slate-400",
                                  theme === 'minecraft' && "text-[#373737] font-pixel",
                                  theme === 'undertale' && "text-white/50 font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                  theme === 'cuphead' && "text-black/50 font-black",
                                  theme === 'comic' && "text-black/50 font-black"
                                )}>
                                  <span>A</span>
                                  <span className="text-base">A</span>
                                </div>
                              </div>

                              {/* Theme Selection */}
                              <div className={cn(
                                "pt-6",
                                theme === 'modern' && "border-t border-slate-100",
                                theme === 'professional' && "border-t border-slate-200",
                                theme === 'cyberpunk' && "border-t border-cyan-500/30",
                                theme === 'vintage' && "border-t-2 border-[#d4c5a1]",
                                theme === 'terminal' && "border-t border-green-500/30",
                                theme === 'ethereal' && "border-t border-indigo-100/50",
                                theme === 'prism' && "border-t border-slate-100",
                                theme === 'minecraft' && "border-t-4 border-[#373737]",
                                theme === 'undertale' && "border-t-2 border-white/20",
                                theme === 'god-of-war' && "border-t border-[#8b0000]",
                                theme === 'cuphead' && "border-t-4 border-black",
                                theme === 'comic' && "border-t-4 border-black"
                              )}>
                                <label className={cn(
                                  "text-sm font-semibold flex items-center mb-4",
                                  theme === 'modern' && "text-slate-700",
                                  theme === 'professional' && "text-slate-800 font-serif",
                                  theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                  theme === 'vintage' && "text-[#4a3728] font-serif",
                                  theme === 'terminal' && "text-green-500 font-mono",
                                  theme === 'ethereal' && "text-indigo-900 font-serif",
                                  theme === 'prism' && "text-slate-800",
                                  theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                  theme === 'undertale' && "text-white font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase",
                                  theme === 'cuphead' && "text-black font-black uppercase",
                                  theme === 'comic' && "text-black font-black uppercase italic"
                                )}>
                                  <Layout className={cn(
                                    "w-4 h-4 mr-2",
                                    theme === 'modern' && "text-slate-500",
                                    theme === 'professional' && "text-slate-600",
                                    theme === 'cyberpunk' && "text-cyan-600",
                                    theme === 'vintage' && "text-[#8b4513]/60",
                                    theme === 'terminal' && "text-green-700",
                                    theme === 'ethereal' && "text-indigo-400",
                                    theme === 'prism' && "text-slate-500",
                                    theme === 'minecraft' && "text-[#373737]",
                                    theme === 'undertale' && "text-white/50",
                                    theme === 'god-of-war' && "text-[#ffd700]/50",
                                    theme === 'cuphead' && "text-black/50",
                                    theme === 'comic' && "text-black/50"
                                  )} />
                                  Visual Theme
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  {mainThemes.map(t => (
                                    <button
                                      key={t.id}
                                      onClick={() => {
                                        setTheme(t.id as any);
                                        setIsGameThemeMenuOpen(false);
                                      }}
                                      className={cn(
                                        "flex flex-col items-center gap-2 p-3 transition-all",
                                        theme === 'modern' && "rounded-xl border-2",
                                        theme === 'professional' && "rounded-lg border-2",
                                        theme === 'cyberpunk' && "rounded-none border border-cyan-500/30",
                                        theme === 'vintage' && "rounded-sm border-2 border-[#d4c5a1]",
                                        theme === 'terminal' && "rounded-none border border-green-500/30",
                                        theme === 'ethereal' && "rounded-2xl border border-indigo-100",
                                        theme === 'prism' && "rounded-xl border-2",
                                        theme === 'minecraft' && "rounded-none border-4 border-[#373737]",
                                        theme === 'undertale' && "rounded-none border-2 border-white/20",
                                        theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                        theme === 'cuphead' && "rounded-none border-4 border-black",
                                        theme === 'comic' && "rounded-none border-4 border-black",
                                        theme === t.id ? (
                                          theme === 'modern' ? "border-blue-500 bg-blue-50" :
                                          theme === 'professional' ? "border-slate-800 bg-slate-200" :
                                          theme === 'cyberpunk' ? "border-cyan-400 bg-cyan-900/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]" :
                                          theme === 'vintage' ? "border-[#8b4513] bg-[#e6d5b8]" :
                                          theme === 'terminal' ? "border-green-400 bg-green-900/40" :
                                          theme === 'ethereal' ? "border-indigo-400 bg-indigo-100/50" :
                                          theme === 'prism' ? "border-blue-500 bg-blue-50" :
                                          theme === 'minecraft' ? "border-white bg-[#a0a0a0]" :
                                          theme === 'undertale' ? "border-yellow-400 bg-white/10" :
                                          theme === 'god-of-war' ? "border-[#ffd700] bg-[#3a3a3a]" :
                                          theme === 'cuphead' ? "border-black bg-[#d8d8c0] shadow-[4px_4px_0_rgba(0,0,0,1)]" :
                                          theme === 'comic' ? "border-black bg-yellow-200 shadow-[4px_4px_0_rgba(0,0,0,1)]" : ""
                                        ) : (
                                          theme === 'modern' ? "border-slate-100 hover:border-slate-200" :
                                          theme === 'professional' ? "border-slate-200 hover:border-slate-300" :
                                          theme === 'cyberpunk' ? "hover:border-cyan-500/60 hover:bg-cyan-950/20" :
                                          theme === 'vintage' ? "hover:border-[#8b4513]/50 hover:bg-[#f4ecd8]" :
                                          theme === 'terminal' ? "hover:border-green-500/60 hover:bg-green-900/20" :
                                          theme === 'ethereal' ? "hover:border-indigo-300 hover:bg-indigo-50/50" :
                                          theme === 'prism' ? "border-slate-100 hover:border-slate-200" :
                                          theme === 'minecraft' ? "hover:bg-[#8b8b8b]" :
                                          theme === 'undertale' ? "hover:border-white/50 hover:bg-white/5" :
                                          theme === 'god-of-war' ? "hover:border-[#8b0000] hover:bg-[#2a2a2a]" :
                                          theme === 'cuphead' ? "hover:bg-[#e8e8d0]" :
                                          theme === 'comic' ? "hover:bg-yellow-100" : ""
                                        )
                                      )}
                                    >
                                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", t.color)}>
                                        <t.icon className="w-5 h-5" />
                                      </div>
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider text-center",
                                        theme === 'modern' && "text-slate-700",
                                        theme === 'professional' && "text-slate-800",
                                        theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                        theme === 'vintage' && "text-[#4a3728] font-serif",
                                        theme === 'terminal' && "text-green-500 font-mono",
                                        theme === 'ethereal' && "text-indigo-900",
                                        theme === 'prism' && "text-slate-800",
                                        theme === 'minecraft' && "text-white font-pixel text-[8px]",
                                        theme === 'undertale' && "text-white font-retro",
                                        theme === 'god-of-war' && "text-[#ffd700] font-serif",
                                        theme === 'cuphead' && "text-black font-black",
                                        theme === 'comic' && "text-black font-black"
                                      )}>{t.name}</span>
                                    </button>
                                  ))}
                                  
                                  {/* Game Theme Category */}
                                  <div className="relative col-span-3 mt-2">
                                    <button
                                      onClick={() => setIsGameThemeMenuOpen(!isGameThemeMenuOpen)}
                                      className={cn(
                                        "w-full flex items-center justify-between p-4 transition-all",
                                        theme === 'modern' && "rounded-2xl border-2",
                                        theme === 'professional' && "rounded-xl border-2",
                                        theme === 'cyberpunk' && "rounded-none border border-cyan-500/30",
                                        theme === 'vintage' && "rounded-sm border-2 border-[#d4c5a1]",
                                        theme === 'terminal' && "rounded-none border border-green-500/30",
                                        theme === 'ethereal' && "rounded-2xl border border-indigo-100",
                                        theme === 'prism' && "rounded-2xl border-2",
                                        theme === 'minecraft' && "rounded-none border-4 border-[#373737]",
                                        theme === 'undertale' && "rounded-none border-2 border-white/20",
                                        theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                        theme === 'cuphead' && "rounded-none border-4 border-black",
                                        theme === 'comic' && "rounded-none border-4 border-black",
                                        (theme === 'minecraft' || theme === 'undertale' || theme === 'god-of-war' || theme === 'cuphead') ? (
                                          theme === 'minecraft' ? "border-white bg-[#a0a0a0]" :
                                          theme === 'undertale' ? "border-yellow-400 bg-white/10" :
                                          theme === 'god-of-war' ? "border-[#ffd700] bg-[#3a3a3a]" :
                                          theme === 'cuphead' ? "border-black bg-[#d8d8c0] shadow-[4px_4px_0_rgba(0,0,0,1)]" : ""
                                        ) : (
                                          theme === 'modern' ? "border-slate-100 hover:border-slate-200" :
                                          theme === 'professional' ? "border-slate-200 hover:border-slate-300" :
                                          theme === 'cyberpunk' ? "hover:border-cyan-500/60 hover:bg-cyan-950/20" :
                                          theme === 'vintage' ? "hover:border-[#8b4513]/50 hover:bg-[#f4ecd8]" :
                                          theme === 'terminal' ? "hover:border-green-500/60 hover:bg-green-900/20" :
                                          theme === 'ethereal' ? "hover:border-indigo-300 hover:bg-indigo-50/50" :
                                          theme === 'prism' ? "border-slate-100 hover:border-slate-200" :
                                          theme === 'comic' ? "hover:bg-yellow-100" : ""
                                        )
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-10 h-10 flex items-center justify-center text-white",
                                          theme === 'modern' && "rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200",
                                          theme === 'professional' && "rounded-lg bg-slate-800",
                                          theme === 'cyberpunk' && "rounded-none bg-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
                                          theme === 'vintage' && "rounded-sm bg-[#8b4513]",
                                          theme === 'terminal' && "rounded-none bg-green-600",
                                          theme === 'ethereal' && "rounded-xl bg-indigo-500",
                                          theme === 'prism' && "rounded-xl bg-blue-600",
                                          theme === 'minecraft' && "rounded-none bg-[#373737] border-2 border-[#1a1a1a]",
                                          theme === 'undertale' && "rounded-none bg-white/20 border border-white",
                                          theme === 'god-of-war' && "rounded-none bg-[#8b0000] border border-[#ffd700]",
                                          theme === 'cuphead' && "rounded-none bg-black border-2 border-white",
                                          theme === 'comic' && "rounded-none bg-red-500 border-2 border-black"
                                        )}>
                                          <Play className="w-6 h-6" />
                                        </div>
                                        <div className="text-left">
                                          <span className={cn(
                                            "block text-sm font-bold",
                                            theme === 'modern' && "text-slate-800",
                                            theme === 'professional' && "text-slate-900 font-serif",
                                            theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                            theme === 'vintage' && "text-[#4a3728] font-serif",
                                            theme === 'terminal' && "text-green-500 font-mono",
                                            theme === 'ethereal' && "text-indigo-900 font-serif",
                                            theme === 'prism' && "text-slate-800",
                                            theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                            theme === 'undertale' && "text-yellow-400 font-retro tracking-widest",
                                            theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase tracking-widest",
                                            theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                                            theme === 'comic' && "text-black font-black uppercase tracking-tighter italic"
                                          )}>Game Themes</span>
                                          <span className={cn(
                                            "block text-[10px] uppercase tracking-widest font-bold",
                                            theme === 'modern' && "text-slate-500",
                                            theme === 'professional' && "text-slate-500",
                                            theme === 'cyberpunk' && "text-cyan-600",
                                            theme === 'vintage' && "text-[#8b4513]/60",
                                            theme === 'terminal' && "text-green-700",
                                            theme === 'ethereal' && "text-indigo-400",
                                            theme === 'prism' && "text-slate-500",
                                            theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                            theme === 'undertale' && "text-white/50 font-retro",
                                            theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                            theme === 'cuphead' && "text-black/50 font-black",
                                            theme === 'comic' && "text-black/50 font-black"
                                          )}>Special Styles</span>
                                        </div>
                                      </div>
                                      <motion.div
                                        animate={{ rotate: isGameThemeMenuOpen ? 180 : 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                      >
                                        <Plus className={cn(
                                          "w-5 h-5",
                                          theme === 'modern' && "text-slate-400",
                                          theme === 'professional' && "text-slate-500",
                                          theme === 'cyberpunk' && "text-cyan-600",
                                          theme === 'vintage' && "text-[#8b4513]/60",
                                          theme === 'terminal' && "text-green-700",
                                          theme === 'ethereal' && "text-indigo-400",
                                          theme === 'prism' && "text-slate-400",
                                          theme === 'minecraft' && "text-[#373737]",
                                          theme === 'undertale' && "text-white/50",
                                          theme === 'god-of-war' && "text-[#ffd700]/50",
                                          theme === 'cuphead' && "text-black/50",
                                          theme === 'comic' && "text-black/50"
                                        )} />
                                      </motion.div>
                                    </button>

                                    <AnimatePresence>
                                      {isGameThemeMenuOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className={cn(
                                            "grid grid-cols-2 gap-2 mt-2 p-2",
                                            theme === 'modern' && "bg-slate-50 rounded-2xl border border-slate-100",
                                            theme === 'professional' && "bg-slate-100 rounded-xl border border-slate-200",
                                            theme === 'cyberpunk' && "bg-black/50 rounded-none border border-cyan-500/30",
                                            theme === 'vintage' && "bg-[#f4ecd8] rounded-sm border-2 border-[#d4c5a1]",
                                            theme === 'terminal' && "bg-black rounded-none border border-green-500/30",
                                            theme === 'ethereal' && "bg-indigo-50/50 rounded-2xl border border-indigo-100",
                                            theme === 'prism' && "bg-slate-50 rounded-2xl border border-slate-100",
                                            theme === 'minecraft' && "bg-[#8b8b8b] rounded-none border-4 border-[#373737]",
                                            theme === 'undertale' && "bg-black rounded-none border-2 border-white/20",
                                            theme === 'god-of-war' && "bg-[#2a2a2a] rounded-none border border-[#8b0000]/50",
                                            theme === 'cuphead' && "bg-[#e8e8d0] rounded-none border-4 border-black",
                                            theme === 'comic' && "bg-yellow-100 rounded-none border-4 border-black"
                                          )}>
                                            {gameThemes.map(t => (
                                              <button
                                                key={t.id}
                                                onClick={() => setTheme(t.id as any)}
                                                className={cn(
                                                  "flex items-center gap-3 p-3 transition-all",
                                                  theme === 'modern' && "rounded-xl border-2 bg-white",
                                                  theme === 'professional' && "rounded-lg border-2 bg-white",
                                                  theme === 'cyberpunk' && "rounded-none border border-cyan-500/30 bg-black/80",
                                                  theme === 'vintage' && "rounded-sm border-2 border-[#d4c5a1] bg-[#fdfbf7]",
                                                  theme === 'terminal' && "rounded-none border border-green-500/30 bg-black",
                                                  theme === 'ethereal' && "rounded-xl border border-indigo-100 bg-white/50",
                                                  theme === 'prism' && "rounded-xl border-2 bg-white",
                                                  theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#c6c6c6]",
                                                  theme === 'undertale' && "rounded-none border-2 border-white/20 bg-black",
                                                  theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50 bg-[#1a1a1a]",
                                                  theme === 'cuphead' && "rounded-none border-4 border-black bg-[#f5f5dc]",
                                                  theme === 'comic' && "rounded-none border-4 border-black bg-white",
                                                  theme === t.id ? (
                                                    theme === 'minecraft' ? "border-white shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff]" :
                                                    theme === 'undertale' ? "border-yellow-400" :
                                                    theme === 'god-of-war' ? "border-[#ffd700]" :
                                                    theme === 'cuphead' ? "border-black shadow-[4px_4px_0_rgba(0,0,0,1)]" :
                                                    theme === 'comic' ? "border-black shadow-[4px_4px_0_rgba(0,0,0,1)]" : "border-blue-500 shadow-md scale-[1.02]"
                                                  ) : (
                                                    theme === 'minecraft' ? "hover:bg-[#a0a0a0]" :
                                                    theme === 'undertale' ? "hover:border-white/50" :
                                                    theme === 'god-of-war' ? "hover:border-[#8b0000]" :
                                                    theme === 'cuphead' ? "hover:bg-[#d8d8c0]" :
                                                    theme === 'comic' ? "hover:bg-yellow-50" : "border-transparent hover:border-slate-200"
                                                  )
                                                )}
                                              >
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm", t.color)}>
                                                  <t.icon className="w-4 h-4" />
                                                </div>
                                                <span className={cn(
                                                  "text-xs font-bold",
                                                  theme === 'modern' && "text-slate-700",
                                                  theme === 'professional' && "text-slate-800 font-serif",
                                                  theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                                  theme === 'vintage' && "text-[#4a3728] font-serif",
                                                  theme === 'terminal' && "text-green-500 font-mono",
                                                  theme === 'ethereal' && "text-indigo-900",
                                                  theme === 'prism' && "text-slate-800",
                                                  theme === 'minecraft' && "text-white font-pixel text-[8px]",
                                                  theme === 'undertale' && "text-white font-retro",
                                                  theme === 'god-of-war' && "text-[#ffd700] font-serif",
                                                  theme === 'cuphead' && "text-black font-black",
                                                  theme === 'comic' && "text-black font-black"
                                                )}>{t.name}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>

                              {/* Font Selection */}
                              <div className={cn(
                                "pt-6",
                                theme === 'modern' && "border-t border-slate-100",
                                theme === 'professional' && "border-t border-slate-200",
                                theme === 'cyberpunk' && "border-t border-cyan-500/30",
                                theme === 'vintage' && "border-t-2 border-[#d4c5a1]",
                                theme === 'terminal' && "border-t border-green-500/30",
                                theme === 'ethereal' && "border-t border-indigo-100/50",
                                theme === 'prism' && "border-t border-slate-100",
                                theme === 'minecraft' && "border-t-4 border-[#373737]",
                                theme === 'undertale' && "border-t-2 border-white/20",
                                theme === 'god-of-war' && "border-t border-[#8b0000]",
                                theme === 'cuphead' && "border-t-4 border-black",
                                theme === 'comic' && "border-t-4 border-black"
                              )}>
                                <div className="flex items-center justify-between mb-4">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800 font-serif",
                                    theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                    theme === 'vintage' && "text-[#4a3728] font-serif",
                                    theme === 'terminal' && "text-green-500 font-mono",
                                    theme === 'ethereal' && "text-indigo-900 font-serif",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase",
                                    theme === 'cuphead' && "text-black font-black uppercase",
                                    theme === 'comic' && "text-black font-black uppercase italic"
                                  )}>
                                    <FontIcon className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-slate-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Typography
                                  </label>
                                  <label className={cn(
                                    "cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors",
                                    theme === 'modern' && "bg-blue-50 text-blue-600 hover:bg-blue-100",
                                    theme === 'professional' && "bg-slate-200 text-slate-700 hover:bg-slate-300",
                                    theme === 'cyberpunk' && "bg-cyan-900/50 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900",
                                    theme === 'vintage' && "bg-[#e6d5b8] text-[#8b4513] border border-[#d4c5a1] hover:bg-[#d4c5a1]",
                                    theme === 'terminal' && "bg-green-900/30 text-green-400 border border-green-500/30 hover:bg-green-900/50",
                                    theme === 'ethereal' && "bg-indigo-100/50 text-indigo-600 hover:bg-indigo-100",
                                    theme === 'prism' && "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                    theme === 'minecraft' && "bg-[#373737] text-white font-pixel text-[8px] border-2 border-[#1a1a1a] hover:bg-[#555]",
                                    theme === 'undertale' && "bg-white/10 text-yellow-400 font-retro border border-white/20 hover:bg-white/20",
                                    theme === 'god-of-war' && "bg-[#8b0000]/30 text-[#ffd700] font-serif border border-[#8b0000] hover:bg-[#8b0000]/50",
                                    theme === 'cuphead' && "bg-[#e8e8d0] text-black font-black border-2 border-black hover:bg-[#d8d8c0]",
                                    theme === 'comic' && "bg-yellow-200 text-black font-black border-2 border-black hover:bg-yellow-300"
                                  )}>
                                    <Plus className="w-3 h-3 inline mr-1" />
                                    Upload Font
                                    <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                                  </label>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                  <button
                                    onClick={() => setSelectedFont('Inter')}
                                    className={cn(
                                      "w-full flex items-center justify-between p-2 transition-all",
                                      theme === 'modern' && "rounded-xl border-2",
                                      theme === 'professional' && "rounded-lg border-2",
                                      theme === 'cyberpunk' && "rounded-none border border-cyan-500/30",
                                      theme === 'vintage' && "rounded-sm border-2 border-[#d4c5a1]",
                                      theme === 'terminal' && "rounded-none border border-green-500/30",
                                      theme === 'ethereal' && "rounded-xl border border-indigo-100",
                                      theme === 'prism' && "rounded-xl border-2",
                                      theme === 'minecraft' && "rounded-none border-4 border-[#373737]",
                                      theme === 'undertale' && "rounded-none border-2 border-white/20",
                                      theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                      theme === 'cuphead' && "rounded-none border-4 border-black",
                                      theme === 'comic' && "rounded-none border-4 border-black",
                                      selectedFont === 'Inter' ? (
                                        theme === 'modern' ? "border-blue-500 bg-blue-50" :
                                        theme === 'professional' ? "border-slate-800 bg-slate-200" :
                                        theme === 'cyberpunk' ? "border-cyan-400 bg-cyan-900/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]" :
                                        theme === 'vintage' ? "border-[#8b4513] bg-[#e6d5b8]" :
                                        theme === 'terminal' ? "border-green-400 bg-green-900/40" :
                                        theme === 'ethereal' ? "border-indigo-400 bg-indigo-100/50" :
                                        theme === 'prism' ? "border-blue-500 bg-blue-50" :
                                        theme === 'minecraft' ? "border-white bg-[#a0a0a0] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff]" :
                                        theme === 'undertale' ? "border-yellow-400 bg-white/10" :
                                        theme === 'god-of-war' ? "border-[#ffd700] bg-[#3a3a3a]" :
                                        theme === 'cuphead' ? "border-black bg-[#d8d8c0] shadow-[4px_4px_0_rgba(0,0,0,1)]" :
                                        theme === 'comic' ? "border-black bg-yellow-200 shadow-[4px_4px_0_rgba(0,0,0,1)]" : ""
                                      ) : (
                                        theme === 'modern' ? "border-slate-100 hover:border-slate-200" :
                                        theme === 'professional' ? "border-slate-200 hover:border-slate-300" :
                                        theme === 'cyberpunk' ? "hover:border-cyan-500/60 hover:bg-cyan-950/20" :
                                        theme === 'vintage' ? "hover:border-[#8b4513]/50 hover:bg-[#f4ecd8]" :
                                        theme === 'terminal' ? "hover:border-green-500/60 hover:bg-green-900/20" :
                                        theme === 'ethereal' ? "hover:border-indigo-300 hover:bg-indigo-50/50" :
                                        theme === 'prism' ? "border-slate-100 hover:border-slate-200" :
                                        theme === 'minecraft' ? "hover:bg-[#8b8b8b]" :
                                        theme === 'undertale' ? "hover:border-white/50 hover:bg-white/5" :
                                        theme === 'god-of-war' ? "hover:border-[#8b0000] hover:bg-[#2a2a2a]" :
                                        theme === 'cuphead' ? "hover:bg-[#e8e8d0]" :
                                        theme === 'comic' ? "hover:bg-yellow-100" : ""
                                      )
                                    )}
                                  >
                                    <span className={cn(
                                      "text-sm font-medium",
                                      theme === 'modern' && "text-slate-700",
                                      theme === 'professional' && "text-slate-800",
                                      theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                      theme === 'vintage' && "text-[#4a3728] font-serif",
                                      theme === 'terminal' && "text-green-500 font-mono",
                                      theme === 'ethereal' && "text-indigo-900",
                                      theme === 'prism' && "text-slate-800",
                                      theme === 'minecraft' && "text-white font-pixel text-xs",
                                      theme === 'undertale' && "text-white font-retro",
                                      theme === 'god-of-war' && "text-[#ffd700] font-serif",
                                      theme === 'cuphead' && "text-black font-black",
                                      theme === 'comic' && "text-black font-black"
                                    )}>Inter (Default)</span>
                                    {selectedFont === 'Inter' && <Check className={cn(
                                      "w-4 h-4",
                                      theme === 'modern' && "text-blue-500",
                                      theme === 'professional' && "text-slate-800",
                                      theme === 'cyberpunk' && "text-cyan-400",
                                      theme === 'vintage' && "text-[#8b4513]",
                                      theme === 'terminal' && "text-green-400",
                                      theme === 'ethereal' && "text-indigo-500",
                                      theme === 'prism' && "text-blue-600",
                                      theme === 'minecraft' && "text-white",
                                      theme === 'undertale' && "text-yellow-400",
                                      theme === 'god-of-war' && "text-[#ffd700]",
                                      theme === 'cuphead' && "text-black",
                                      theme === 'comic' && "text-black"
                                    )} />}
                                  </button>

                                  {uploadedFonts.map(font => (
                                    <div key={font.name} className="flex items-center gap-2">
                                      <button
                                        onClick={() => setSelectedFont(font.name)}
                                        className={cn(
                                          "flex-1 flex items-center justify-between p-2 transition-all",
                                          theme === 'modern' && "rounded-xl border-2",
                                          theme === 'professional' && "rounded-lg border-2",
                                          theme === 'cyberpunk' && "rounded-none border border-cyan-500/30",
                                          theme === 'vintage' && "rounded-sm border-2 border-[#d4c5a1]",
                                          theme === 'terminal' && "rounded-none border border-green-500/30",
                                          theme === 'ethereal' && "rounded-xl border border-indigo-100",
                                          theme === 'prism' && "rounded-xl border-2",
                                          theme === 'minecraft' && "rounded-none border-4 border-[#373737]",
                                          theme === 'undertale' && "rounded-none border-2 border-white/20",
                                          theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                          theme === 'cuphead' && "rounded-none border-4 border-black",
                                          theme === 'comic' && "rounded-none border-4 border-black",
                                          selectedFont === font.name ? (
                                            theme === 'modern' ? "border-blue-500 bg-blue-50" :
                                            theme === 'professional' ? "border-slate-800 bg-slate-200" :
                                            theme === 'cyberpunk' ? "border-cyan-400 bg-cyan-900/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]" :
                                            theme === 'vintage' ? "border-[#8b4513] bg-[#e6d5b8]" :
                                            theme === 'terminal' ? "border-green-400 bg-green-900/40" :
                                            theme === 'ethereal' ? "border-indigo-400 bg-indigo-100/50" :
                                            theme === 'prism' ? "border-blue-500 bg-blue-50" :
                                            theme === 'minecraft' ? "border-white bg-[#a0a0a0] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff]" :
                                            theme === 'undertale' ? "border-yellow-400 bg-white/10" :
                                            theme === 'god-of-war' ? "border-[#ffd700] bg-[#3a3a3a]" :
                                            theme === 'cuphead' ? "border-black bg-[#d8d8c0] shadow-[4px_4px_0_rgba(0,0,0,1)]" :
                                            theme === 'comic' ? "border-black bg-yellow-200 shadow-[4px_4px_0_rgba(0,0,0,1)]" : ""
                                          ) : (
                                            theme === 'modern' ? "border-slate-100 hover:border-slate-200" :
                                            theme === 'professional' ? "border-slate-200 hover:border-slate-300" :
                                            theme === 'cyberpunk' ? "hover:border-cyan-500/60 hover:bg-cyan-950/20" :
                                            theme === 'vintage' ? "hover:border-[#8b4513]/50 hover:bg-[#f4ecd8]" :
                                            theme === 'terminal' ? "hover:border-green-500/60 hover:bg-green-900/20" :
                                            theme === 'ethereal' ? "hover:border-indigo-300 hover:bg-indigo-50/50" :
                                            theme === 'prism' ? "border-slate-100 hover:border-slate-200" :
                                            theme === 'minecraft' ? "hover:bg-[#8b8b8b]" :
                                            theme === 'undertale' ? "hover:border-white/50 hover:bg-white/5" :
                                            theme === 'god-of-war' ? "hover:border-[#8b0000] hover:bg-[#2a2a2a]" :
                                            theme === 'cuphead' ? "hover:bg-[#e8e8d0]" :
                                            theme === 'comic' ? "hover:bg-yellow-100" : ""
                                          )
                                        )}
                                      >
                                        <span className={cn(
                                          "text-sm font-medium truncate max-w-[120px]",
                                          theme === 'modern' && "text-slate-700",
                                          theme === 'professional' && "text-slate-800",
                                          theme === 'cyberpunk' && "text-cyan-400",
                                          theme === 'vintage' && "text-[#4a3728]",
                                          theme === 'terminal' && "text-green-500",
                                          theme === 'ethereal' && "text-indigo-900",
                                          theme === 'prism' && "text-slate-800",
                                          theme === 'minecraft' && "text-white",
                                          theme === 'undertale' && "text-white",
                                          theme === 'god-of-war' && "text-[#ffd700]",
                                          theme === 'cuphead' && "text-black",
                                          theme === 'comic' && "text-black"
                                        )} style={{ fontFamily: font.name }}>{font.name}</span>
                                        {selectedFont === font.name && <Check className={cn(
                                          "w-4 h-4",
                                          theme === 'modern' && "text-blue-500",
                                          theme === 'professional' && "text-slate-800",
                                          theme === 'cyberpunk' && "text-cyan-400",
                                          theme === 'vintage' && "text-[#8b4513]",
                                          theme === 'terminal' && "text-green-400",
                                          theme === 'ethereal' && "text-indigo-500",
                                          theme === 'prism' && "text-blue-600",
                                          theme === 'minecraft' && "text-white",
                                          theme === 'undertale' && "text-yellow-400",
                                          theme === 'god-of-war' && "text-[#ffd700]",
                                          theme === 'cuphead' && "text-black",
                                          theme === 'comic' && "text-black"
                                        )} />}
                                      </button>
                                      <button 
                                        onClick={() => handleRemoveFont(font.name)}
                                        className={cn(
                                          "p-2 transition-colors",
                                          theme === 'modern' && "text-slate-400 hover:text-red-500",
                                          theme === 'professional' && "text-slate-500 hover:text-red-600",
                                          theme === 'cyberpunk' && "text-cyan-600 hover:text-red-500",
                                          theme === 'vintage' && "text-[#8b4513]/60 hover:text-red-700",
                                          theme === 'terminal' && "text-green-700 hover:text-red-500",
                                          theme === 'ethereal' && "text-indigo-400 hover:text-red-500",
                                          theme === 'prism' && "text-slate-400 hover:text-red-500",
                                          theme === 'minecraft' && "text-[#373737] hover:text-red-500",
                                          theme === 'undertale' && "text-white/50 hover:text-red-500",
                                          theme === 'god-of-war' && "text-[#ffd700]/50 hover:text-red-600",
                                          theme === 'cuphead' && "text-black/50 hover:text-red-600",
                                          theme === 'comic' && "text-black/50 hover:text-red-600"
                                        )}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Color Cycle Customization */}
                              <div className={cn(
                                "pt-6",
                                theme === 'modern' && "border-t border-slate-100",
                                theme === 'professional' && "border-t border-slate-200",
                                theme === 'cyberpunk' && "border-t border-cyan-500/30",
                                theme === 'vintage' && "border-t-2 border-[#d4c5a1]",
                                theme === 'terminal' && "border-t border-green-500/30",
                                theme === 'ethereal' && "border-t border-indigo-100/50",
                                theme === 'prism' && "border-t border-slate-100",
                                theme === 'minecraft' && "border-t-4 border-[#373737]",
                                theme === 'undertale' && "border-t-2 border-white/20",
                                theme === 'god-of-war' && "border-t border-[#8b0000]",
                                theme === 'cuphead' && "border-t-4 border-black",
                                theme === 'comic' && "border-t-4 border-black"
                              )}>
                                <div className="flex items-center justify-between mb-4">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800 font-serif",
                                    theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                    theme === 'vintage' && "text-[#4a3728] font-serif",
                                    theme === 'terminal' && "text-green-500 font-mono",
                                    theme === 'ethereal' && "text-indigo-900 font-serif",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase",
                                    theme === 'cuphead' && "text-black font-black uppercase",
                                    theme === 'comic' && "text-black font-black uppercase italic"
                                  )}>
                                    <Sparkles className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-blue-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Color Cycle
                                  </label>
                                  <button 
                                    onClick={() => setSelectedColors([])}
                                    className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider transition-colors",
                                      theme === 'modern' && "text-slate-400 hover:text-red-500",
                                      theme === 'professional' && "text-slate-500 hover:text-red-600",
                                      theme === 'cyberpunk' && "text-cyan-600 hover:text-red-500",
                                      theme === 'vintage' && "text-[#8b4513]/60 hover:text-red-700",
                                      theme === 'terminal' && "text-green-700 hover:text-red-500",
                                      theme === 'ethereal' && "text-indigo-400 hover:text-red-500",
                                      theme === 'prism' && "text-slate-400 hover:text-red-500",
                                      theme === 'minecraft' && "text-[#373737] hover:text-red-500",
                                      theme === 'undertale' && "text-white/50 hover:text-red-500",
                                      theme === 'god-of-war' && "text-[#ffd700]/50 hover:text-red-600",
                                      theme === 'cuphead' && "text-black/50 hover:text-red-600",
                                      theme === 'comic' && "text-black/50 hover:text-red-600"
                                    )}
                                  >
                                    Clear All
                                  </button>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {PRESET_COLORS.map(color => {
                                    const count = selectedColors.filter(c => c === color.hex).length;
                                    const isSelected = count > 0;
                                    return (
                                      <button
                                        key={color.id}
                                        onClick={() => {
                                          setSelectedColors(prev => [...prev, color.hex]);
                                        }}
                                        className={cn(
                                          "w-8 h-8 transition-all relative flex items-center justify-center",
                                          theme === 'modern' && "rounded-full border-2",
                                          theme === 'professional' && "rounded-lg border-2",
                                          theme === 'cyberpunk' && "rounded-none border-2",
                                          theme === 'vintage' && "rounded-sm border-2",
                                          theme === 'terminal' && "rounded-none border-2",
                                          theme === 'ethereal' && "rounded-full border-2",
                                          theme === 'prism' && "rounded-xl border-2",
                                          theme === 'minecraft' && "rounded-none border-[3px]",
                                          theme === 'undertale' && "rounded-none border-2",
                                          theme === 'god-of-war' && "rounded-none border-2",
                                          theme === 'cuphead' && "rounded-none border-4",
                                          theme === 'comic' && "rounded-none border-4",
                                          isSelected ? (
                                            theme === 'modern' ? "border-slate-900 scale-110 shadow-md" :
                                            theme === 'professional' ? "border-slate-800 scale-110 shadow-md" :
                                            theme === 'cyberpunk' ? "border-cyan-400 scale-110 shadow-[0_0_10px_rgba(6,182,212,0.8)]" :
                                            theme === 'vintage' ? "border-[#4a3728] scale-110 shadow-md" :
                                            theme === 'terminal' ? "border-green-400 scale-110 shadow-[0_0_10px_rgba(34,197,94,0.8)]" :
                                            theme === 'ethereal' ? "border-indigo-500 scale-110 shadow-md" :
                                            theme === 'prism' ? "border-slate-800 scale-110 shadow-md" :
                                            theme === 'minecraft' ? "border-white scale-110 shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.5),inset_2px_2px_0_rgba(255,255,255,0.5)]" :
                                            theme === 'undertale' ? "border-yellow-400 scale-110" :
                                            theme === 'god-of-war' ? "border-[#ffd700] scale-110 shadow-[0_0_10px_rgba(255,215,0,0.5)]" :
                                            theme === 'cuphead' ? "border-black scale-110 shadow-[4px_4px_0_rgba(0,0,0,1)]" :
                                            theme === 'comic' ? "border-black scale-110 shadow-[4px_4px_0_rgba(0,0,0,1)]" : ""
                                          ) : (
                                            theme === 'modern' ? "border-transparent hover:scale-105" :
                                            theme === 'professional' ? "border-transparent hover:scale-105" :
                                            theme === 'cyberpunk' ? "border-transparent hover:border-cyan-500/50 hover:scale-105" :
                                            theme === 'vintage' ? "border-transparent hover:border-[#8b4513]/50 hover:scale-105" :
                                            theme === 'terminal' ? "border-transparent hover:border-green-500/50 hover:scale-105" :
                                            theme === 'ethereal' ? "border-transparent hover:border-indigo-300 hover:scale-105" :
                                            theme === 'prism' ? "border-transparent hover:scale-105" :
                                            theme === 'minecraft' ? "border-[#373737] hover:border-white/50" :
                                            theme === 'undertale' ? "border-transparent hover:border-white/50 hover:scale-105" :
                                            theme === 'god-of-war' ? "border-transparent hover:border-[#8b0000] hover:scale-105" :
                                            theme === 'cuphead' ? "border-black/20 hover:border-black hover:scale-105" :
                                            theme === 'comic' ? "border-black/20 hover:border-black hover:scale-105" : ""
                                          )
                                        )}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                      >
                                        {isSelected && (
                                          <span className={cn(
                                            "absolute -top-2 -right-2 text-[10px] min-w-[1rem] h-4 px-1 flex items-center justify-center font-bold border",
                                            theme === 'modern' && "bg-slate-900 text-white rounded-full border-white",
                                            theme === 'professional' && "bg-slate-800 text-white rounded-md border-white",
                                            theme === 'cyberpunk' && "bg-cyan-500 text-black rounded-none border-black",
                                            theme === 'vintage' && "bg-[#4a3728] text-[#fdfbf7] rounded-sm border-[#d4c5a1]",
                                            theme === 'terminal' && "bg-green-500 text-black rounded-none border-black",
                                            theme === 'ethereal' && "bg-indigo-500 text-white rounded-full border-white",
                                            theme === 'prism' && "bg-slate-800 text-white rounded-md border-white",
                                            theme === 'minecraft' && "bg-[#373737] text-white rounded-none border-white font-pixel text-[8px]",
                                            theme === 'undertale' && "bg-yellow-400 text-black rounded-none border-black font-retro",
                                            theme === 'god-of-war' && "bg-[#8b0000] text-[#ffd700] rounded-none border-[#ffd700] font-serif",
                                            theme === 'cuphead' && "bg-black text-[#f5f5dc] rounded-none border-white font-black",
                                            theme === 'comic' && "bg-black text-white rounded-none border-white font-black"
                                          )}>
                                            {count}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                
                                {selectedColors.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        theme === 'modern' && "text-slate-400",
                                        theme === 'professional' && "text-slate-500",
                                        theme === 'cyberpunk' && "text-cyan-600",
                                        theme === 'vintage' && "text-[#8b4513]/60",
                                        theme === 'terminal' && "text-green-700",
                                        theme === 'ethereal' && "text-indigo-400",
                                        theme === 'prism' && "text-slate-400",
                                        theme === 'minecraft' && "text-[#373737]",
                                        theme === 'undertale' && "text-white/50",
                                        theme === 'god-of-war' && "text-[#ffd700]/50",
                                        theme === 'cuphead' && "text-black/50",
                                        theme === 'comic' && "text-black/50"
                                      )}>Current Cycle (Click to remove)</span>
                                      <span className={cn(
                                        "text-[10px] font-medium",
                                        theme === 'modern' && "text-slate-400",
                                        theme === 'professional' && "text-slate-500",
                                        theme === 'cyberpunk' && "text-cyan-600",
                                        theme === 'vintage' && "text-[#8b4513]/60",
                                        theme === 'terminal' && "text-green-700",
                                        theme === 'ethereal' && "text-indigo-400",
                                        theme === 'prism' && "text-slate-400",
                                        theme === 'minecraft' && "text-[#373737]",
                                        theme === 'undertale' && "text-white/50",
                                        theme === 'god-of-war' && "text-[#ffd700]/50",
                                        theme === 'cuphead' && "text-black/50",
                                        theme === 'comic' && "text-black/50"
                                      )}>
                                        {selectedColors.length} colors
                                      </span>
                                    </div>
                                    <div className={cn(
                                      "flex flex-wrap gap-1.5 p-2",
                                      theme === 'modern' && "bg-slate-50 rounded-xl border border-slate-100",
                                      theme === 'professional' && "bg-slate-100 rounded-lg border border-slate-200",
                                      theme === 'cyberpunk' && "bg-black/50 rounded-none border border-cyan-500/30",
                                      theme === 'vintage' && "bg-[#f4ecd8] rounded-sm border-2 border-[#d4c5a1]",
                                      theme === 'terminal' && "bg-black rounded-none border border-green-500/30",
                                      theme === 'ethereal' && "bg-indigo-50/50 rounded-2xl border border-indigo-100",
                                      theme === 'prism' && "bg-slate-50 rounded-xl border border-slate-100",
                                      theme === 'minecraft' && "bg-[#8b8b8b] rounded-none border-4 border-[#373737]",
                                      theme === 'undertale' && "bg-black rounded-none border-2 border-white/20",
                                      theme === 'god-of-war' && "bg-[#2a2a2a] rounded-none border border-[#8b0000]/50",
                                      theme === 'cuphead' && "bg-[#e8e8d0] rounded-none border-4 border-black",
                                      theme === 'comic' && "bg-yellow-100 rounded-none border-4 border-black"
                                    )}>
                                      {selectedColors.map((hex, i) => (
                                        <button 
                                          key={i} 
                                          onClick={() => {
                                            setSelectedColors(prev => prev.filter((_, idx) => idx !== i));
                                          }}
                                          className={cn(
                                            "group relative flex-shrink-0 w-6 h-6 shadow-sm hover:scale-110 transition-transform",
                                            theme === 'modern' && "rounded-full border border-white",
                                            theme === 'professional' && "rounded-md border border-white",
                                            theme === 'cyberpunk' && "rounded-none border border-cyan-500/30",
                                            theme === 'vintage' && "rounded-sm border border-[#d4c5a1]",
                                            theme === 'terminal' && "rounded-none border border-green-500/30",
                                            theme === 'ethereal' && "rounded-full border border-white",
                                            theme === 'prism' && "rounded-md border border-white",
                                            theme === 'minecraft' && "rounded-none border-2 border-[#373737]",
                                            theme === 'undertale' && "rounded-none border border-white/20",
                                            theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                            theme === 'cuphead' && "rounded-none border-2 border-black",
                                            theme === 'comic' && "rounded-none border-2 border-black"
                                          )}
                                          style={{ backgroundColor: hex }} 
                                        >
                                          <span className={cn(
                                            "absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity",
                                            theme === 'modern' && "rounded-full",
                                            theme === 'professional' && "rounded-md",
                                            theme === 'cyberpunk' && "rounded-none",
                                            theme === 'vintage' && "rounded-sm",
                                            theme === 'terminal' && "rounded-none",
                                            theme === 'ethereal' && "rounded-full",
                                            theme === 'prism' && "rounded-md",
                                            theme === 'minecraft' && "rounded-none",
                                            theme === 'undertale' && "rounded-none",
                                            theme === 'god-of-war' && "rounded-none",
                                            theme === 'cuphead' && "rounded-none",
                                            theme === 'comic' && "rounded-none"
                                          )}>
                                            <X className="w-3 h-3 text-white" />
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className={cn(
                                    "text-[10px] italic",
                                    theme === 'modern' && "text-slate-400",
                                    theme === 'professional' && "text-slate-500",
                                    theme === 'cyberpunk' && "text-cyan-700",
                                    theme === 'vintage' && "text-[#8b4513]/40",
                                    theme === 'terminal' && "text-green-800",
                                    theme === 'ethereal' && "text-indigo-300",
                                    theme === 'prism' && "text-slate-400",
                                    theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                    theme === 'undertale' && "text-white/30 font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700]/30 font-serif",
                                    theme === 'cuphead' && "text-black/40 font-black",
                                    theme === 'comic' && "text-black/40 font-black"
                                  )}>
                                    Pick colors to create a custom theme cycle.
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}

                          {renderAccordionSection('media', 'Media & Backgrounds', MonitorPlay, (
                            <div className="space-y-6">
                              {/* Video Background Settings */}
                              <div>
                                <div className="flex items-center justify-between mb-4">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800 font-serif",
                                    theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                    theme === 'vintage' && "text-[#4a3728] font-serif",
                                    theme === 'terminal' && "text-green-500 font-mono",
                                    theme === 'ethereal' && "text-indigo-900 font-serif",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase",
                                    theme === 'cuphead' && "text-black font-black uppercase",
                                    theme === 'comic' && "text-black font-black uppercase italic"
                                  )}>
                                    <Play className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-slate-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Video Background
                                  </label>
                                  <button
                                    onClick={() => setVideoBackgroundEnabled(!videoBackgroundEnabled)}
                                    className={cn(
                                      "relative inline-flex h-6 w-11 items-center transition-colors",
                                      theme === 'modern' && "rounded-full",
                                      theme === 'professional' && "rounded-full",
                                      theme === 'cyberpunk' && "rounded-none",
                                      theme === 'vintage' && "rounded-sm",
                                      theme === 'terminal' && "rounded-none",
                                      theme === 'ethereal' && "rounded-full",
                                      theme === 'prism' && "rounded-full",
                                      theme === 'minecraft' && "rounded-none border-2 border-[#373737]",
                                      theme === 'undertale' && "rounded-none border border-white/20",
                                      theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                      theme === 'cuphead' && "rounded-none border-2 border-black",
                                      theme === 'comic' && "rounded-none border-2 border-black",
                                      videoBackgroundEnabled ? (
                                        theme === 'modern' ? "bg-blue-600" :
                                        theme === 'professional' ? "bg-slate-800" :
                                        theme === 'cyberpunk' ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" :
                                        theme === 'vintage' ? "bg-[#8b4513]" :
                                        theme === 'terminal' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                        theme === 'ethereal' ? "bg-indigo-500" :
                                        theme === 'prism' ? "bg-blue-600" :
                                        theme === 'minecraft' ? "bg-[#555]" :
                                        theme === 'undertale' ? "bg-yellow-400" :
                                        theme === 'god-of-war' ? "bg-[#8b0000]" :
                                        theme === 'cuphead' ? "bg-black" :
                                        theme === 'comic' ? "bg-black" : "bg-emerald-600"
                                      ) : (
                                        theme === 'modern' ? "bg-slate-200" :
                                        theme === 'professional' ? "bg-slate-300" :
                                        theme === 'cyberpunk' ? "bg-cyan-950/50 border border-cyan-500/30" :
                                        theme === 'vintage' ? "bg-[#d4c5a1]" :
                                        theme === 'terminal' ? "bg-green-950/50 border border-green-500/30" :
                                        theme === 'ethereal' ? "bg-indigo-100" :
                                        theme === 'prism' ? "bg-slate-200" :
                                        theme === 'minecraft' ? "bg-[#8b8b8b]" :
                                        theme === 'undertale' ? "bg-black" :
                                        theme === 'god-of-war' ? "bg-[#2a2a2a]" :
                                        theme === 'cuphead' ? "bg-[#e8e8d0]" :
                                        theme === 'comic' ? "bg-yellow-100" : "bg-slate-200"
                                      )
                                    )}
                                  >
                                    <span className={cn(
                                      "inline-block h-4 w-4 transform transition-transform",
                                      theme === 'modern' && "rounded-full bg-white",
                                      theme === 'professional' && "rounded-full bg-white",
                                      theme === 'cyberpunk' && "rounded-none bg-white",
                                      theme === 'vintage' && "rounded-sm bg-[#fdfbf7]",
                                      theme === 'terminal' && "rounded-none bg-white",
                                      theme === 'ethereal' && "rounded-full bg-white",
                                      theme === 'prism' && "rounded-full bg-white",
                                      theme === 'minecraft' && "rounded-none bg-white border border-[#373737]",
                                      theme === 'undertale' && "rounded-none bg-white",
                                      theme === 'god-of-war' && "rounded-none bg-[#ffd700]",
                                      theme === 'cuphead' && "rounded-none bg-white border border-black",
                                      theme === 'comic' && "rounded-none bg-white border border-black",
                                      videoBackgroundEnabled ? 'translate-x-6' : 'translate-x-1'
                                    )} />
                                  </button>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider",
                                      theme === 'modern' && "text-slate-400",
                                      theme === 'professional' && "text-slate-500",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-400",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )}>Video Source</label>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text"
                                        value={customVideoUrl}
                                        onChange={(e) => setCustomVideoUrl(e.target.value)}
                                        placeholder="Paste video URL here..."
                                        className={cn(
                                          "flex-1 px-3 py-2 text-xs outline-none transition-all",
                                          theme === 'modern' && "bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                          theme === 'professional' && "bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500",
                                          theme === 'cyberpunk' && "bg-black/50 border border-cyan-500/30 rounded-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] text-cyan-400 placeholder-cyan-800",
                                          theme === 'vintage' && "bg-[#f4ecd8] border-2 border-[#d4c5a1] rounded-sm focus:border-[#8b4513] text-[#4a3728] placeholder-[#8b4513]/40",
                                          theme === 'terminal' && "bg-black border border-green-500/30 rounded-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] text-green-500 placeholder-green-800",
                                          theme === 'ethereal' && "bg-indigo-50/50 border border-indigo-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                          theme === 'prism' && "bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                          theme === 'minecraft' && "bg-[#8b8b8b] border-4 border-[#373737] rounded-none focus:border-white text-white placeholder-white/50 font-pixel text-[8px]",
                                          theme === 'undertale' && "bg-black border-2 border-white/20 rounded-none focus:border-yellow-400 text-white placeholder-white/30 font-retro",
                                          theme === 'god-of-war' && "bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none focus:border-[#ffd700] text-[#ffd700] placeholder-[#ffd700]/30 font-serif",
                                          theme === 'cuphead' && "bg-[#e8e8d0] border-4 border-black rounded-none focus:bg-[#d8d8c0] text-black placeholder-black/40 font-black",
                                          theme === 'comic' && "bg-yellow-100 border-4 border-black rounded-none focus:bg-yellow-200 text-black placeholder-black/40 font-black"
                                        )}
                                      />
                                      {customVideoUrl && (
                                        <button 
                                          onClick={() => setCustomVideoUrl('')}
                                          className={cn(
                                            "p-2 transition-colors",
                                            theme === 'modern' && "text-slate-400 hover:text-red-500",
                                            theme === 'professional' && "text-slate-500 hover:text-red-600",
                                            theme === 'cyberpunk' && "text-cyan-600 hover:text-red-500",
                                            theme === 'vintage' && "text-[#8b4513]/60 hover:text-red-700",
                                            theme === 'terminal' && "text-green-700 hover:text-red-500",
                                            theme === 'ethereal' && "text-indigo-400 hover:text-red-500",
                                            theme === 'prism' && "text-slate-400 hover:text-red-500",
                                            theme === 'minecraft' && "text-[#373737] hover:text-red-500",
                                            theme === 'undertale' && "text-white/50 hover:text-red-500",
                                            theme === 'god-of-war' && "text-[#ffd700]/50 hover:text-red-600",
                                            theme === 'cuphead' && "text-black/50 hover:text-red-600",
                                            theme === 'comic' && "text-black/50 hover:text-red-600"
                                          )}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        theme === 'modern' && "text-slate-400",
                                        theme === 'professional' && "text-slate-500",
                                        theme === 'cyberpunk' && "text-cyan-600",
                                        theme === 'vintage' && "text-[#8b4513]/60",
                                        theme === 'terminal' && "text-green-700",
                                        theme === 'ethereal' && "text-indigo-400",
                                        theme === 'prism' && "text-slate-400",
                                        theme === 'minecraft' && "text-[#373737]",
                                        theme === 'undertale' && "text-white/50",
                                        theme === 'god-of-war' && "text-[#ffd700]/50",
                                        theme === 'cuphead' && "text-black/50",
                                        theme === 'comic' && "text-black/50"
                                      )}>Upload Video</label>
                                      {videoBackgroundBase64 && (
                                        <button 
                                          onClick={() => setVideoBackgroundBase64('')}
                                          className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                                        >
                                          Remove Upload
                                        </button>
                                      )}
                                    </div>
                                    <label className={cn(
                                      "flex flex-col items-center justify-center w-full h-20 border-2 border-dashed transition-all cursor-pointer group",
                                      theme === 'modern' && "border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-500/50",
                                      theme === 'professional' && "border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-500/50",
                                      theme === 'cyberpunk' && "border-cyan-500/30 rounded-none hover:bg-cyan-950/20 hover:border-cyan-400",
                                      theme === 'vintage' && "border-[#d4c5a1] rounded-sm hover:bg-[#f4ecd8] hover:border-[#8b4513]/50",
                                      theme === 'terminal' && "border-green-500/30 rounded-none hover:bg-green-900/20 hover:border-green-400",
                                      theme === 'ethereal' && "border-indigo-200 rounded-2xl hover:bg-indigo-50/50 hover:border-indigo-400",
                                      theme === 'prism' && "border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-500/50",
                                      theme === 'minecraft' && "border-[#373737] rounded-none border-solid border-4 bg-[#8b8b8b] hover:bg-[#a0a0a0] hover:border-white",
                                      theme === 'undertale' && "border-white/20 rounded-none hover:bg-white/5 hover:border-yellow-400",
                                      theme === 'god-of-war' && "border-[#8b0000]/50 rounded-none hover:bg-[#2a2a2a] hover:border-[#ffd700]",
                                      theme === 'cuphead' && "border-black rounded-none border-solid border-4 bg-[#e8e8d0] hover:bg-[#d8d8c0]",
                                      theme === 'comic' && "border-black rounded-none border-solid border-4 bg-yellow-100 hover:bg-yellow-200"
                                    )}>
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className={cn(
                                          "w-5 h-5 mb-1",
                                          videoBackgroundBase64 ? (
                                            theme === 'modern' ? "text-blue-500" :
                                            theme === 'professional' ? "text-slate-800" :
                                            theme === 'cyberpunk' ? "text-cyan-400" :
                                            theme === 'vintage' ? "text-[#8b4513]" :
                                            theme === 'terminal' ? "text-green-400" :
                                            theme === 'ethereal' ? "text-indigo-500" :
                                            theme === 'prism' ? "text-blue-600" :
                                            theme === 'minecraft' ? "text-white" :
                                            theme === 'undertale' ? "text-yellow-400" :
                                            theme === 'god-of-war' ? "text-[#ffd700]" :
                                            theme === 'cuphead' ? "text-black" :
                                            theme === 'comic' ? "text-black" : "text-emerald-500"
                                          ) : (
                                            theme === 'modern' ? "text-slate-400 group-hover:text-blue-500" :
                                            theme === 'professional' ? "text-slate-500 group-hover:text-slate-800" :
                                            theme === 'cyberpunk' ? "text-cyan-600 group-hover:text-cyan-400" :
                                            theme === 'vintage' ? "text-[#8b4513]/60 group-hover:text-[#8b4513]" :
                                            theme === 'terminal' ? "text-green-700 group-hover:text-green-400" :
                                            theme === 'ethereal' ? "text-indigo-400 group-hover:text-indigo-500" :
                                            theme === 'prism' ? "text-slate-400 group-hover:text-blue-600" :
                                            theme === 'minecraft' ? "text-[#373737] group-hover:text-white" :
                                            theme === 'undertale' ? "text-white/50 group-hover:text-yellow-400" :
                                            theme === 'god-of-war' ? "text-[#ffd700]/50 group-hover:text-[#ffd700]" :
                                            theme === 'cuphead' ? "text-black/50 group-hover:text-black" :
                                            theme === 'comic' ? "text-black/50 group-hover:text-black" : "text-slate-400 group-hover:text-emerald-500"
                                          )
                                        )} />
                                        <p className={cn(
                                          "text-[10px] font-bold uppercase tracking-wider",
                                          theme === 'modern' && "text-slate-500",
                                          theme === 'professional' && "text-slate-600",
                                          theme === 'cyberpunk' && "text-cyan-600",
                                          theme === 'vintage' && "text-[#8b4513]/60",
                                          theme === 'terminal' && "text-green-700",
                                          theme === 'ethereal' && "text-indigo-400",
                                          theme === 'prism' && "text-slate-500",
                                          theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                          theme === 'undertale' && "text-white/50 font-retro",
                                          theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                          theme === 'cuphead' && "text-black/50 font-black",
                                          theme === 'comic' && "text-black/50 font-black"
                                        )}>
                                          {videoBackgroundBase64 ? "Video Uploaded" : "Choose Video File"}
                                        </p>
                                      </div>
                                      <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} />
                                    </label>
                                  </div>

                                  <p className={cn(
                                    "text-[10px] italic",
                                    theme === 'modern' && "text-slate-500",
                                    theme === 'professional' && "text-slate-600",
                                    theme === 'cyberpunk' && "text-cyan-700",
                                    theme === 'vintage' && "text-[#8b4513]/50",
                                    theme === 'terminal' && "text-green-800",
                                    theme === 'ethereal' && "text-indigo-400",
                                    theme === 'prism' && "text-slate-500",
                                    theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                    theme === 'undertale' && "text-white/40 font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700]/40 font-serif",
                                    theme === 'cuphead' && "text-black/50 font-black",
                                    theme === 'comic' && "text-black/50 font-black"
                                  )}>
                                    {theme === 'minecraft' 
                                      ? "If no custom video is provided, the default Minecraft background will be used."
                                      : "Enable to add a custom video background to this theme."}
                                  </p>
                                </div>
                              </div>

                              {/* Overlay Video Settings */}
                              <div className={cn(
                                "pt-6 border-t",
                                theme === 'modern' && "border-slate-100",
                                theme === 'professional' && "border-slate-200",
                                theme === 'cyberpunk' && "border-cyan-500/30",
                                theme === 'vintage' && "border-[#8b4513]/20",
                                theme === 'terminal' && "border-green-500/30",
                                theme === 'ethereal' && "border-indigo-100",
                                theme === 'prism' && "border-slate-200",
                                theme === 'minecraft' && "border-[#373737] border-4 border-t-8 border-l-0 border-r-0 border-b-0",
                                theme === 'undertale' && "border-white/20 border-2 border-t-4 border-l-0 border-r-0 border-b-0",
                                theme === 'god-of-war' && "border-[#8b0000]/50",
                                theme === 'cuphead' && "border-black border-4 border-t-8 border-l-0 border-r-0 border-b-0",
                                theme === 'comic' && "border-black border-4 border-t-8 border-l-0 border-r-0 border-b-0"
                              )}>
                                <div className="flex items-center justify-between mb-4">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800 font-serif",
                                    theme === 'cyberpunk' && "text-cyan-400 font-mono",
                                    theme === 'vintage' && "text-[#4a3728] font-serif",
                                    theme === 'terminal' && "text-green-500 font-mono",
                                    theme === 'ethereal' && "text-indigo-900 font-serif",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-xs drop-shadow-md",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase",
                                    theme === 'cuphead' && "text-black font-black uppercase",
                                    theme === 'comic' && "text-black font-black uppercase italic"
                                  )}>
                                    <Ghost className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-slate-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Overlay Videos
                                  </label>
                                  <button
                                    onClick={() => addOverlayVideo({})}
                                    className={cn(
                                      "flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                                      theme === 'modern' && "bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100",
                                      theme === 'professional' && "bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200",
                                      theme === 'cyberpunk' && "bg-cyan-950/50 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]",
                                      theme === 'vintage' && "bg-[#d4c5a1] text-[#4a3728] rounded-sm hover:bg-[#c4b591] border border-[#8b4513]/20",
                                      theme === 'terminal' && "bg-green-950/50 text-green-400 border border-green-500/50 hover:bg-green-900/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                                      theme === 'ethereal' && "bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100",
                                      theme === 'prism' && "bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100",
                                      theme === 'minecraft' && "bg-[#8b8b8b] text-white border-2 border-[#373737] hover:bg-[#a0a0a0] font-pixel text-[8px]",
                                      theme === 'undertale' && "bg-black text-white border border-white/50 hover:border-yellow-400 hover:text-yellow-400 font-retro",
                                      theme === 'god-of-war' && "bg-[#2a2a2a] text-[#ffd700] border border-[#8b0000]/50 hover:bg-[#3a2a2a] hover:border-[#ffd700]",
                                      theme === 'cuphead' && "bg-[#e8e8d0] text-black border-2 border-black hover:bg-[#d8d8c0] font-black",
                                      theme === 'comic' && "bg-yellow-100 text-black border-2 border-black hover:bg-yellow-200 font-black"
                                    )}
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add New
                                  </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {overlayVideos.length === 0 ? (
                                    <div className={cn(
                                      "p-8 border-2 border-dashed flex flex-col items-center justify-center text-center",
                                      theme === 'modern' && "border-slate-100 rounded-xl",
                                      theme === 'professional' && "border-slate-200 rounded-lg",
                                      theme === 'cyberpunk' && "border-cyan-500/30 rounded-none bg-cyan-950/10",
                                      theme === 'vintage' && "border-[#d4c5a1] rounded-sm bg-[#f4ecd8]/50",
                                      theme === 'terminal' && "border-green-500/30 rounded-none bg-green-950/10",
                                      theme === 'ethereal' && "border-indigo-100 rounded-2xl",
                                      theme === 'prism' && "border-slate-200 rounded-xl",
                                      theme === 'minecraft' && "border-[#373737] rounded-none border-solid border-4 bg-[#8b8b8b]/50",
                                      theme === 'undertale' && "border-white/20 rounded-none bg-white/5",
                                      theme === 'god-of-war' && "border-[#8b0000]/50 rounded-none bg-[#2a2a2a]/50",
                                      theme === 'cuphead' && "border-black rounded-none border-solid border-4 bg-[#e8e8d0]/50",
                                      theme === 'comic' && "border-black rounded-none border-solid border-4 bg-yellow-100/50"
                                    )}>
                                      <Ghost className={cn(
                                        "w-8 h-8 mb-2",
                                        theme === 'modern' && "text-slate-200",
                                        theme === 'professional' && "text-slate-300",
                                        theme === 'cyberpunk' && "text-cyan-800",
                                        theme === 'vintage' && "text-[#8b4513]/30",
                                        theme === 'terminal' && "text-green-800",
                                        theme === 'ethereal' && "text-indigo-200",
                                        theme === 'prism' && "text-slate-200",
                                        theme === 'minecraft' && "text-[#373737]/50",
                                        theme === 'undertale' && "text-white/20",
                                        theme === 'god-of-war' && "text-[#ffd700]/20",
                                        theme === 'cuphead' && "text-black/20",
                                        theme === 'comic' && "text-black/20"
                                      )} />
                                      <p className={cn(
                                        "text-xs",
                                        theme === 'modern' && "text-slate-400",
                                        theme === 'professional' && "text-slate-500",
                                        theme === 'cyberpunk' && "text-cyan-600",
                                        theme === 'vintage' && "text-[#8b4513]/60",
                                        theme === 'terminal' && "text-green-700",
                                        theme === 'ethereal' && "text-indigo-400",
                                        theme === 'prism' && "text-slate-400",
                                        theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                        theme === 'undertale' && "text-white/50 font-retro",
                                        theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                        theme === 'cuphead' && "text-black/50 font-black",
                                        theme === 'comic' && "text-black/50 font-black"
                                      )}>No overlay videos added yet.</p>
                                    </div>
                                  ) : (
                                    overlayVideos.map((video, index) => (
                                      <div key={video.id} className={cn(
                                        "p-4 border space-y-4 relative group",
                                        theme === 'modern' && "bg-slate-50 border-slate-200 rounded-xl",
                                        theme === 'professional' && "bg-slate-50 border-slate-300 rounded-lg",
                                        theme === 'cyberpunk' && "bg-black/50 border-cyan-500/30 rounded-none",
                                        theme === 'vintage' && "bg-[#f4ecd8] border-[#d4c5a1] rounded-sm",
                                        theme === 'terminal' && "bg-black border-green-500/30 rounded-none",
                                        theme === 'ethereal' && "bg-indigo-50/50 border-indigo-200 rounded-2xl",
                                        theme === 'prism' && "bg-slate-50 border-slate-200 rounded-xl",
                                        theme === 'minecraft' && "bg-[#8b8b8b] border-[#373737] border-4 rounded-none",
                                        theme === 'undertale' && "bg-black border-white/20 border-2 rounded-none",
                                        theme === 'god-of-war' && "bg-[#2a2a2a] border-[#8b0000]/50 rounded-none",
                                        theme === 'cuphead' && "bg-[#e8e8d0] border-black border-4 rounded-none",
                                        theme === 'comic' && "bg-yellow-100 border-black border-4 rounded-none"
                                      )}>
                                        <div className="flex items-center justify-between">
                                          <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            theme === 'modern' && "text-slate-400",
                                            theme === 'professional' && "text-slate-500",
                                            theme === 'cyberpunk' && "text-cyan-600",
                                            theme === 'vintage' && "text-[#8b4513]/60",
                                            theme === 'terminal' && "text-green-700",
                                            theme === 'ethereal' && "text-indigo-400",
                                            theme === 'prism' && "text-slate-400",
                                            theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                            theme === 'undertale' && "text-white/50 font-retro",
                                            theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                            theme === 'cuphead' && "text-black/50 font-black",
                                            theme === 'comic' && "text-black/50 font-black"
                                          )}>Overlay #{index + 1}</span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => updateOverlayVideo(video.id, { enabled: !video.enabled })}
                                              className={cn(
                                                "relative inline-flex h-5 w-9 items-center transition-colors",
                                                theme === 'modern' && "rounded-full",
                                                theme === 'professional' && "rounded-full",
                                                theme === 'cyberpunk' && "rounded-none",
                                                theme === 'vintage' && "rounded-sm",
                                                theme === 'terminal' && "rounded-none",
                                                theme === 'ethereal' && "rounded-full",
                                                theme === 'prism' && "rounded-full",
                                                theme === 'minecraft' && "rounded-none border-2 border-[#373737]",
                                                theme === 'undertale' && "rounded-none border border-white/20",
                                                theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                                theme === 'cuphead' && "rounded-none border-2 border-black",
                                                theme === 'comic' && "rounded-none border-2 border-black",
                                                video.enabled ? (
                                                  theme === 'modern' ? "bg-blue-600" :
                                                  theme === 'professional' ? "bg-slate-800" :
                                                  theme === 'cyberpunk' ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" :
                                                  theme === 'vintage' ? "bg-[#8b4513]" :
                                                  theme === 'terminal' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                                  theme === 'ethereal' ? "bg-indigo-500" :
                                                  theme === 'prism' ? "bg-blue-600" :
                                                  theme === 'minecraft' ? "bg-[#555]" :
                                                  theme === 'undertale' ? "bg-yellow-400" :
                                                  theme === 'god-of-war' ? "bg-[#8b0000]" :
                                                  theme === 'cuphead' ? "bg-black" :
                                                  theme === 'comic' ? "bg-black" : "bg-blue-600"
                                                ) : (
                                                  theme === 'modern' ? "bg-slate-300" :
                                                  theme === 'professional' ? "bg-slate-300" :
                                                  theme === 'cyberpunk' ? "bg-cyan-950/50 border border-cyan-500/30" :
                                                  theme === 'vintage' ? "bg-[#d4c5a1]" :
                                                  theme === 'terminal' ? "bg-green-950/50 border border-green-500/30" :
                                                  theme === 'ethereal' ? "bg-indigo-200" :
                                                  theme === 'prism' ? "bg-slate-300" :
                                                  theme === 'minecraft' ? "bg-[#8b8b8b]" :
                                                  theme === 'undertale' ? "bg-black" :
                                                  theme === 'god-of-war' ? "bg-[#2a2a2a]" :
                                                  theme === 'cuphead' ? "bg-[#e8e8d0]" :
                                                  theme === 'comic' ? "bg-yellow-100" : "bg-slate-300"
                                                )
                                              )}
                                            >
                                              <span className={cn(
                                                "inline-block h-3 w-3 transform transition-transform",
                                                theme === 'modern' && "rounded-full bg-white",
                                                theme === 'professional' && "rounded-full bg-white",
                                                theme === 'cyberpunk' && "rounded-none bg-white",
                                                theme === 'vintage' && "rounded-sm bg-[#fdfbf7]",
                                                theme === 'terminal' && "rounded-none bg-white",
                                                theme === 'ethereal' && "rounded-full bg-white",
                                                theme === 'prism' && "rounded-full bg-white",
                                                theme === 'minecraft' && "rounded-none bg-white border border-[#373737]",
                                                theme === 'undertale' && "rounded-none bg-white",
                                                theme === 'god-of-war' && "rounded-none bg-[#ffd700]",
                                                theme === 'cuphead' && "rounded-none bg-white border border-black",
                                                theme === 'comic' && "rounded-none bg-white border border-black",
                                                video.enabled ? 'translate-x-5' : 'translate-x-1'
                                              )} />
                                            </button>
                                            <button
                                              onClick={() => removeOverlayVideo(video.id)}
                                              className={cn(
                                                "p-1 transition-colors",
                                                theme === 'modern' && "text-slate-400 hover:text-red-500",
                                                theme === 'professional' && "text-slate-500 hover:text-red-600",
                                                theme === 'cyberpunk' && "text-cyan-600 hover:text-red-500",
                                                theme === 'vintage' && "text-[#8b4513]/60 hover:text-red-700",
                                                theme === 'terminal' && "text-green-700 hover:text-red-500",
                                                theme === 'ethereal' && "text-indigo-400 hover:text-red-500",
                                                theme === 'prism' && "text-slate-400 hover:text-red-500",
                                                theme === 'minecraft' && "text-[#373737] hover:text-red-500",
                                                theme === 'undertale' && "text-white/50 hover:text-red-500",
                                                theme === 'god-of-war' && "text-[#ffd700]/50 hover:text-red-600",
                                                theme === 'cuphead' && "text-black/50 hover:text-red-600",
                                                theme === 'comic' && "text-black/50 hover:text-red-600"
                                              )}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="space-y-3">
                                          <div className="space-y-1">
                                            <label className={cn(
                                              "text-[10px] font-bold uppercase tracking-wider",
                                              theme === 'modern' && "text-slate-400",
                                              theme === 'professional' && "text-slate-500",
                                              theme === 'cyberpunk' && "text-cyan-600",
                                              theme === 'vintage' && "text-[#8b4513]/60",
                                              theme === 'terminal' && "text-green-700",
                                              theme === 'ethereal' && "text-indigo-400",
                                              theme === 'prism' && "text-slate-400",
                                              theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                              theme === 'undertale' && "text-white/50 font-retro",
                                              theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                              theme === 'cuphead' && "text-black/50 font-black",
                                              theme === 'comic' && "text-black/50 font-black"
                                            )}>Video URL</label>
                                            <div className="flex gap-2">
                                              <input 
                                                type="text"
                                                value={video.url}
                                                onChange={(e) => updateOverlayVideo(video.id, { url: e.target.value, base64: '' })}
                                                placeholder="Paste URL here..."
                                                className={cn(
                                                  "flex-1 px-3 py-1.5 text-xs outline-none transition-all",
                                                  theme === 'modern' && "bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                                  theme === 'professional' && "bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500",
                                                  theme === 'cyberpunk' && "bg-black/50 border border-cyan-500/30 rounded-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] text-cyan-400 placeholder-cyan-800",
                                                  theme === 'vintage' && "bg-[#fdfbf7] border-2 border-[#d4c5a1] rounded-sm focus:border-[#8b4513] text-[#4a3728] placeholder-[#8b4513]/40",
                                                  theme === 'terminal' && "bg-black border border-green-500/30 rounded-none focus:border-green-400 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] text-green-500 placeholder-green-800",
                                                  theme === 'ethereal' && "bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                                                  theme === 'prism' && "bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                                  theme === 'minecraft' && "bg-[#8b8b8b] border-2 border-[#373737] rounded-none focus:border-white text-white placeholder-white/50 font-pixel text-[8px]",
                                                  theme === 'undertale' && "bg-black border-2 border-white/20 rounded-none focus:border-yellow-400 text-white placeholder-white/30 font-retro",
                                                  theme === 'god-of-war' && "bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none focus:border-[#ffd700] text-[#ffd700] placeholder-[#ffd700]/30 font-serif",
                                                  theme === 'cuphead' && "bg-[#e8e8d0] border-2 border-black rounded-none focus:bg-[#d8d8c0] text-black placeholder-black/40 font-black",
                                                  theme === 'comic' && "bg-yellow-100 border-2 border-black rounded-none focus:bg-yellow-200 text-black placeholder-black/40 font-black"
                                                )}
                                              />
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                              <label className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                theme === 'modern' && "text-slate-400",
                                                theme === 'professional' && "text-slate-500",
                                                theme === 'cyberpunk' && "text-cyan-600",
                                                theme === 'vintage' && "text-[#8b4513]/60",
                                                theme === 'terminal' && "text-green-700",
                                                theme === 'ethereal' && "text-indigo-400",
                                                theme === 'prism' && "text-slate-400",
                                                theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                                theme === 'undertale' && "text-white/50 font-retro",
                                                theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                                theme === 'cuphead' && "text-black/50 font-black",
                                                theme === 'comic' && "text-black/50 font-black"
                                              )}>Or Upload File</label>
                                            </div>
                                            <label className={cn(
                                              "flex flex-col items-center justify-center w-full h-16 border-2 border-dashed transition-all cursor-pointer group/upload",
                                              theme === 'modern' && "border-slate-200 rounded-lg hover:bg-white hover:border-blue-500/50",
                                              theme === 'professional' && "border-slate-300 rounded-md hover:bg-white hover:border-slate-500/50",
                                              theme === 'cyberpunk' && "border-cyan-500/30 rounded-none hover:bg-cyan-950/20 hover:border-cyan-400",
                                              theme === 'vintage' && "border-[#d4c5a1] rounded-sm hover:bg-[#fdfbf7] hover:border-[#8b4513]/50",
                                              theme === 'terminal' && "border-green-500/30 rounded-none hover:bg-green-900/20 hover:border-green-400",
                                              theme === 'ethereal' && "border-indigo-200 rounded-xl hover:bg-white hover:border-indigo-400",
                                              theme === 'prism' && "border-slate-200 rounded-lg hover:bg-white hover:border-blue-500/50",
                                              theme === 'minecraft' && "border-[#373737] rounded-none border-solid border-2 bg-[#8b8b8b] hover:bg-[#a0a0a0] hover:border-white",
                                              theme === 'undertale' && "border-white/20 rounded-none hover:bg-white/5 hover:border-yellow-400",
                                              theme === 'god-of-war' && "border-[#8b0000]/50 rounded-none hover:bg-[#2a2a2a] hover:border-[#ffd700]",
                                              theme === 'cuphead' && "border-black rounded-none border-solid border-2 bg-[#e8e8d0] hover:bg-[#d8d8c0]",
                                              theme === 'comic' && "border-black rounded-none border-solid border-2 bg-yellow-100 hover:bg-yellow-200"
                                            )}>
                                              <div className="flex flex-col items-center justify-center">
                                                <Upload className={cn(
                                                  "w-4 h-4 mb-1",
                                                  video.base64 ? (
                                                    theme === 'modern' ? "text-blue-500" :
                                                    theme === 'professional' ? "text-slate-800" :
                                                    theme === 'cyberpunk' ? "text-cyan-400" :
                                                    theme === 'vintage' ? "text-[#8b4513]" :
                                                    theme === 'terminal' ? "text-green-400" :
                                                    theme === 'ethereal' ? "text-indigo-500" :
                                                    theme === 'prism' ? "text-blue-600" :
                                                    theme === 'minecraft' ? "text-white" :
                                                    theme === 'undertale' ? "text-yellow-400" :
                                                    theme === 'god-of-war' ? "text-[#ffd700]" :
                                                    theme === 'cuphead' ? "text-black" :
                                                    theme === 'comic' ? "text-black" : "text-blue-500"
                                                  ) : (
                                                    theme === 'modern' ? "text-slate-400 group-hover/upload:text-blue-500" :
                                                    theme === 'professional' ? "text-slate-500 group-hover/upload:text-slate-800" :
                                                    theme === 'cyberpunk' ? "text-cyan-600 group-hover/upload:text-cyan-400" :
                                                    theme === 'vintage' ? "text-[#8b4513]/60 group-hover/upload:text-[#8b4513]" :
                                                    theme === 'terminal' ? "text-green-700 group-hover/upload:text-green-400" :
                                                    theme === 'ethereal' ? "text-indigo-400 group-hover/upload:text-indigo-500" :
                                                    theme === 'prism' ? "text-slate-400 group-hover/upload:text-blue-600" :
                                                    theme === 'minecraft' ? "text-[#373737] group-hover/upload:text-white" :
                                                    theme === 'undertale' ? "text-white/50 group-hover/upload:text-yellow-400" :
                                                    theme === 'god-of-war' ? "text-[#ffd700]/50 group-hover/upload:text-[#ffd700]" :
                                                    theme === 'cuphead' ? "text-black/50 group-hover/upload:text-black" :
                                                    theme === 'comic' ? "text-black/50 group-hover/upload:text-black" : "text-slate-400 group-hover/upload:text-blue-500"
                                                  )
                                                )} />
                                                <p className={cn(
                                                  "text-[9px] font-bold uppercase tracking-wider",
                                                  theme === 'modern' && "text-slate-500",
                                                  theme === 'professional' && "text-slate-600",
                                                  theme === 'cyberpunk' && "text-cyan-600",
                                                  theme === 'vintage' && "text-[#8b4513]/60",
                                                  theme === 'terminal' && "text-green-700",
                                                  theme === 'ethereal' && "text-indigo-400",
                                                  theme === 'prism' && "text-slate-500",
                                                  theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                                  theme === 'undertale' && "text-white/50 font-retro",
                                                  theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                                  theme === 'cuphead' && "text-black/50 font-black",
                                                  theme === 'comic' && "text-black/50 font-black"
                                                )}>
                                                  {video.base64 ? "File Uploaded" : "Choose Video/GIF"}
                                                </p>
                                              </div>
                                              <input type="file" accept="video/mp4,video/webm,image/gif" className="hidden" onChange={(e) => handleOverlayVideoUpload(e, video.id)} />
                                            </label>
                                          </div>

                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                              <label className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                theme === 'modern' && "text-slate-400",
                                                theme === 'professional' && "text-slate-500",
                                                theme === 'cyberpunk' && "text-cyan-600",
                                                theme === 'vintage' && "text-[#8b4513]/60",
                                                theme === 'terminal' && "text-green-700",
                                                theme === 'ethereal' && "text-indigo-400",
                                                theme === 'prism' && "text-slate-400",
                                                theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                                theme === 'undertale' && "text-white/50 font-retro",
                                                theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                                theme === 'cuphead' && "text-black/50 font-black",
                                                theme === 'comic' && "text-black/50 font-black"
                                              )}>Size</label>
                                              <span className={cn(
                                                "text-[10px] font-mono",
                                                theme === 'modern' && "text-blue-500",
                                                theme === 'professional' && "text-slate-600",
                                                theme === 'cyberpunk' && "text-cyan-400",
                                                theme === 'vintage' && "text-[#8b4513]",
                                                theme === 'terminal' && "text-green-400",
                                                theme === 'ethereal' && "text-indigo-500",
                                                theme === 'prism' && "text-blue-600",
                                                theme === 'minecraft' && "text-white font-pixel text-[8px]",
                                                theme === 'undertale' && "text-yellow-400 font-retro",
                                                theme === 'god-of-war' && "text-[#ffd700] font-serif",
                                                theme === 'cuphead' && "text-black font-black",
                                                theme === 'comic' && "text-black font-black"
                                              )}>{video.size}px</span>
                                            </div>
                                            <input 
                                              type="range"
                                              min="100"
                                              max="500"
                                              value={video.size}
                                              onChange={(e) => updateOverlayVideo(video.id, { size: parseInt(e.target.value) })}
                                              className={cn(
                                                "w-full h-1 rounded-lg appearance-none cursor-pointer",
                                                theme === 'modern' && "bg-slate-200 accent-blue-500",
                                                theme === 'professional' && "bg-slate-300 accent-slate-600",
                                                theme === 'cyberpunk' && "bg-cyan-950/50 accent-cyan-400 border border-cyan-500/30",
                                                theme === 'vintage' && "bg-[#d4c5a1] accent-[#8b4513]",
                                                theme === 'terminal' && "bg-green-950/50 accent-green-400 border border-green-500/30",
                                                theme === 'ethereal' && "bg-indigo-200 accent-indigo-500",
                                                theme === 'prism' && "bg-slate-200 accent-blue-600",
                                                theme === 'minecraft' && "bg-[#373737] accent-white rounded-none h-2",
                                                theme === 'undertale' && "bg-white/20 accent-yellow-400 rounded-none h-2",
                                                theme === 'god-of-war' && "bg-[#2a2a2a] accent-[#ffd700] rounded-none h-2 border border-[#8b0000]/50",
                                                theme === 'cuphead' && "bg-black accent-[#e8e8d0] rounded-none h-2",
                                                theme === 'comic' && "bg-black accent-yellow-400 rounded-none h-2"
                                              )}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}

                                  <p className={cn(
                                    "text-[10px] italic",
                                    theme === 'modern' && "text-slate-400",
                                    theme === 'professional' && "text-slate-500",
                                    theme === 'cyberpunk' && "text-cyan-700",
                                    theme === 'vintage' && "text-[#8b4513]/50",
                                    theme === 'terminal' && "text-green-800",
                                    theme === 'ethereal' && "text-indigo-400",
                                    theme === 'prism' && "text-slate-400",
                                    theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                    theme === 'undertale' && "text-white/40 font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700]/40 font-serif",
                                    theme === 'cuphead' && "text-black/50 font-black",
                                    theme === 'comic' && "text-black/50 font-black"
                                  )}>
                                    Tip: Double-click an overlay in the preview to quickly change its size or remove it.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {renderAccordionSection('behavior', 'Behavior', Sliders, (
                            <div className="space-y-6">
                              {/* Drag Mode Toggle */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800",
                                    theme === 'cyberpunk' && "text-cyan-400",
                                    theme === 'vintage' && "text-[#4a3728]",
                                    theme === 'terminal' && "text-green-500",
                                    theme === 'ethereal' && "text-indigo-900",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-[10px]",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif",
                                    theme === 'cuphead' && "text-black font-black",
                                    theme === 'comic' && "text-black font-black"
                                  )}>
                                    <Move className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-slate-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Drag & Drop Images
                                  </label>
                                  <button
                                    onClick={() => setIsDragModeActive(!isDragModeActive)}
                                    className={cn(
                                      "relative inline-flex h-6 w-11 items-center transition-colors",
                                      theme === 'modern' && "rounded-full",
                                      theme === 'professional' && "rounded-full",
                                      theme === 'cyberpunk' && "rounded-none",
                                      theme === 'vintage' && "rounded-sm",
                                      theme === 'terminal' && "rounded-none",
                                      theme === 'ethereal' && "rounded-full",
                                      theme === 'prism' && "rounded-full",
                                      theme === 'minecraft' && "rounded-none border-2 border-[#373737]",
                                      theme === 'undertale' && "rounded-none border border-white/20",
                                      theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                      theme === 'cuphead' && "rounded-none border-2 border-black",
                                      theme === 'comic' && "rounded-none border-2 border-black",
                                      isDragModeActive ? (
                                        theme === 'modern' ? "bg-blue-600" :
                                        theme === 'professional' ? "bg-slate-800" :
                                        theme === 'cyberpunk' ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" :
                                        theme === 'vintage' ? "bg-[#8b4513]" :
                                        theme === 'terminal' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                        theme === 'ethereal' ? "bg-indigo-500" :
                                        theme === 'prism' ? "bg-blue-600" :
                                        theme === 'minecraft' ? "bg-[#555]" :
                                        theme === 'undertale' ? "bg-yellow-400" :
                                        theme === 'god-of-war' ? "bg-[#8b0000]" :
                                        theme === 'cuphead' ? "bg-black" :
                                        theme === 'comic' ? "bg-black" : "bg-blue-600"
                                      ) : (
                                        theme === 'modern' ? "bg-slate-200" :
                                        theme === 'professional' ? "bg-slate-200" :
                                        theme === 'cyberpunk' ? "bg-cyan-950/50 border border-cyan-500/30" :
                                        theme === 'vintage' ? "bg-[#e8dcc4]" :
                                        theme === 'terminal' ? "bg-green-950/50 border border-green-500/30" :
                                        theme === 'ethereal' ? "bg-indigo-100" :
                                        theme === 'prism' ? "bg-slate-200" :
                                        theme === 'minecraft' ? "bg-[#8b8b8b]" :
                                        theme === 'undertale' ? "bg-black" :
                                        theme === 'god-of-war' ? "bg-[#2a2a2a]" :
                                        theme === 'cuphead' ? "bg-[#e8e8d0]" :
                                        theme === 'comic' ? "bg-yellow-100" : "bg-slate-200"
                                      )
                                    )}
                                  >
                                    <span className={cn(
                                      "inline-block h-4 w-4 transform transition-transform",
                                      theme === 'modern' && "rounded-full bg-white",
                                      theme === 'professional' && "rounded-full bg-white",
                                      theme === 'cyberpunk' && "rounded-none bg-white",
                                      theme === 'vintage' && "rounded-sm bg-[#fdfbf7]",
                                      theme === 'terminal' && "rounded-none bg-white",
                                      theme === 'ethereal' && "rounded-full bg-white",
                                      theme === 'prism' && "rounded-full bg-white",
                                      theme === 'minecraft' && "rounded-none bg-white border border-[#373737]",
                                      theme === 'undertale' && "rounded-none bg-white",
                                      theme === 'god-of-war' && "rounded-none bg-[#ffd700]",
                                      theme === 'cuphead' && "rounded-none bg-white border border-black",
                                      theme === 'comic' && "rounded-none bg-white border border-black",
                                      isDragModeActive ? 'translate-x-6' : 'translate-x-1'
                                    )} />
                                  </button>
                                </div>
                                <p className={cn(
                                  "text-xs",
                                  theme === 'modern' && "text-slate-500",
                                  theme === 'professional' && "text-slate-600",
                                  theme === 'cyberpunk' && "text-cyan-600",
                                  theme === 'vintage' && "text-[#8b4513]/60",
                                  theme === 'terminal' && "text-green-700",
                                  theme === 'ethereal' && "text-indigo-400",
                                  theme === 'prism' && "text-slate-500",
                                  theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                  theme === 'undertale' && "text-white/50 font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                  theme === 'cuphead' && "text-black/50 font-black",
                                  theme === 'comic' && "text-black/50 font-black"
                                )}>
                                  Enable to drag extracted images and drop them anywhere inside the document.
                                </p>
                              </div>

                              {/* Ordering Mode Toggle */}
                              <div className={cn(
                                "pt-6",
                                theme === 'modern' && "border-t border-slate-100",
                                theme === 'professional' && "border-t border-slate-200",
                                theme === 'cyberpunk' && "border-t border-cyan-500/30",
                                theme === 'vintage' && "border-t border-[#d4c5a1]",
                                theme === 'terminal' && "border-t border-green-500/30",
                                theme === 'ethereal' && "border-t border-indigo-100",
                                theme === 'prism' && "border-t border-slate-100",
                                theme === 'minecraft' && "border-t-4 border-[#373737]",
                                theme === 'undertale' && "border-t-2 border-white/20",
                                theme === 'god-of-war' && "border-t border-[#8b0000]/50",
                                theme === 'cuphead' && "border-t-4 border-black",
                                theme === 'comic' && "border-t-4 border-black"
                              )}>
                                <div className="flex items-center justify-between mb-2">
                                  <label className={cn(
                                    "text-sm font-semibold flex items-center",
                                    theme === 'modern' && "text-slate-700",
                                    theme === 'professional' && "text-slate-800",
                                    theme === 'cyberpunk' && "text-cyan-400",
                                    theme === 'vintage' && "text-[#4a3728]",
                                    theme === 'terminal' && "text-green-500",
                                    theme === 'ethereal' && "text-indigo-900",
                                    theme === 'prism' && "text-slate-800",
                                    theme === 'minecraft' && "text-white font-pixel text-[10px]",
                                    theme === 'undertale' && "text-white font-retro",
                                    theme === 'god-of-war' && "text-[#ffd700] font-serif",
                                    theme === 'cuphead' && "text-black font-black",
                                    theme === 'comic' && "text-black font-black"
                                  )}>
                                    <Layout className={cn(
                                      "w-4 h-4 mr-2",
                                      theme === 'modern' && "text-slate-500",
                                      theme === 'professional' && "text-slate-600",
                                      theme === 'cyberpunk' && "text-cyan-600",
                                      theme === 'vintage' && "text-[#8b4513]/60",
                                      theme === 'terminal' && "text-green-700",
                                      theme === 'ethereal' && "text-indigo-400",
                                      theme === 'prism' && "text-slate-500",
                                      theme === 'minecraft' && "text-[#373737]",
                                      theme === 'undertale' && "text-white/50",
                                      theme === 'god-of-war' && "text-[#ffd700]/50",
                                      theme === 'cuphead' && "text-black/50",
                                      theme === 'comic' && "text-black/50"
                                    )} />
                                    Ordering Mode
                                  </label>
                                  <button
                                    onClick={() => setIsOrderingMode(!isOrderingMode)}
                                    className={cn(
                                      "relative inline-flex h-6 w-11 items-center transition-colors",
                                      theme === 'modern' && "rounded-full",
                                      theme === 'professional' && "rounded-full",
                                      theme === 'cyberpunk' && "rounded-none",
                                      theme === 'vintage' && "rounded-sm",
                                      theme === 'terminal' && "rounded-none",
                                      theme === 'ethereal' && "rounded-full",
                                      theme === 'prism' && "rounded-full",
                                      theme === 'minecraft' && "rounded-none border-2 border-[#373737]",
                                      theme === 'undertale' && "rounded-none border border-white/20",
                                      theme === 'god-of-war' && "rounded-none border border-[#8b0000]/50",
                                      theme === 'cuphead' && "rounded-none border-2 border-black",
                                      theme === 'comic' && "rounded-none border-2 border-black",
                                      isOrderingMode ? (
                                        theme === 'modern' ? "bg-blue-600" :
                                        theme === 'professional' ? "bg-slate-800" :
                                        theme === 'cyberpunk' ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" :
                                        theme === 'vintage' ? "bg-[#8b4513]" :
                                        theme === 'terminal' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                        theme === 'ethereal' ? "bg-indigo-500" :
                                        theme === 'prism' ? "bg-blue-600" :
                                        theme === 'minecraft' ? "bg-[#555]" :
                                        theme === 'undertale' ? "bg-yellow-400" :
                                        theme === 'god-of-war' ? "bg-[#8b0000]" :
                                        theme === 'cuphead' ? "bg-black" :
                                        theme === 'comic' ? "bg-black" : "bg-blue-600"
                                      ) : (
                                        theme === 'modern' ? "bg-slate-200" :
                                        theme === 'professional' ? "bg-slate-200" :
                                        theme === 'cyberpunk' ? "bg-cyan-950/50 border border-cyan-500/30" :
                                        theme === 'vintage' ? "bg-[#e8dcc4]" :
                                        theme === 'terminal' ? "bg-green-950/50 border border-green-500/30" :
                                        theme === 'ethereal' ? "bg-indigo-100" :
                                        theme === 'prism' ? "bg-slate-200" :
                                        theme === 'minecraft' ? "bg-[#8b8b8b]" :
                                        theme === 'undertale' ? "bg-black" :
                                        theme === 'god-of-war' ? "bg-[#2a2a2a]" :
                                        theme === 'cuphead' ? "bg-[#e8e8d0]" :
                                        theme === 'comic' ? "bg-yellow-100" : "bg-slate-200"
                                      )
                                    )}
                                  >
                                    <span className={cn(
                                      "inline-block h-4 w-4 transform transition-transform",
                                      theme === 'modern' && "rounded-full bg-white",
                                      theme === 'professional' && "rounded-full bg-white",
                                      theme === 'cyberpunk' && "rounded-none bg-white",
                                      theme === 'vintage' && "rounded-sm bg-[#fdfbf7]",
                                      theme === 'terminal' && "rounded-none bg-white",
                                      theme === 'ethereal' && "rounded-full bg-white",
                                      theme === 'prism' && "rounded-full bg-white",
                                      theme === 'minecraft' && "rounded-none bg-white border border-[#373737]",
                                      theme === 'undertale' && "rounded-none bg-white",
                                      theme === 'god-of-war' && "rounded-none bg-[#ffd700]",
                                      theme === 'cuphead' && "rounded-none bg-white border border-black",
                                      theme === 'comic' && "rounded-none bg-white border border-black",
                                      isOrderingMode ? 'translate-x-6' : 'translate-x-1'
                                    )} />
                                  </button>
                                </div>
                                <p className={cn(
                                  "text-xs",
                                  theme === 'modern' && "text-slate-500",
                                  theme === 'professional' && "text-slate-600",
                                  theme === 'cyberpunk' && "text-cyan-600",
                                  theme === 'vintage' && "text-[#8b4513]/60",
                                  theme === 'terminal' && "text-green-700",
                                  theme === 'ethereal' && "text-indigo-400",
                                  theme === 'prism' && "text-slate-500",
                                  theme === 'minecraft' && "text-[#373737] font-pixel text-[8px]",
                                  theme === 'undertale' && "text-white/50 font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
                                  theme === 'cuphead' && "text-black/50 font-black",
                                  theme === 'comic' && "text-black/50 font-black"
                                )}>
                                  Enable content reordering and image placement zones.
                                </p>
                              </div>
                            </div>
                          ))}

                          {renderAccordionSection('import-export', 'Import Data', FileUp, (
                            <div className="space-y-6">
                              <HtmlUploader 
                                theme={theme}
                                onMetadataExtracted={(metadata) => {
                                handleHtmlMetadataExtracted(metadata);
                                setIsSettingsOpen(false);
                              }} />
                              
                              <div className={cn(
                                "border-t pt-6",
                                theme === 'modern' && "border-slate-100",
                                theme === 'professional' && "border-slate-200",
                                theme === 'cyberpunk' && "border-cyan-900",
                                theme === 'vintage' && "border-[#d4c5a1]",
                                theme === 'terminal' && "border-green-900",
                                theme === 'ethereal' && "border-indigo-100",
                                theme === 'prism' && "border-slate-100",
                                theme === 'minecraft' && "border-[#373737]",
                                theme === 'undertale' && "border-white/20",
                                theme === 'god-of-war' && "border-[#8b0000]/30",
                                theme === 'cuphead' && "border-black",
                                theme === 'comic' && "border-black"
                              )}>
                                <div className="grid grid-cols-1 gap-6">
                                  <PdfUploader 
                                    mode="full"
                                    theme={theme}
                                    onPdfParsed={(data) => {
                                      setParsedData(data);
                                      setIsSettingsOpen(false);
                                    }} 
                                  />
                                  
                                  <div className={cn(
                                    "border-t pt-6",
                                    theme === 'modern' && "border-slate-100",
                                    theme === 'professional' && "border-slate-200",
                                    theme === 'cyberpunk' && "border-cyan-900",
                                    theme === 'vintage' && "border-[#d4c5a1]",
                                    theme === 'terminal' && "border-green-900",
                                    theme === 'ethereal' && "border-indigo-100",
                                    theme === 'prism' && "border-slate-100",
                                    theme === 'minecraft' && "border-[#373737]",
                                    theme === 'undertale' && "border-white/20",
                                    theme === 'god-of-war' && "border-[#8b0000]/30",
                                    theme === 'cuphead' && "border-black",
                                    theme === 'comic' && "border-black"
                                  )}>
                                    <PdfUploader 
                                      mode="images"
                                      theme={theme}
                                      onImagesExtracted={(images) => {
                                        setExtractedImages(prev => [...prev, ...images]);
                                        setIsSettingsOpen(false);
                                      }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {renderAccordionSection('views', 'Export & Views', Eye, (
                            <div className="space-y-4">
                              <button 
                                onClick={() => navigate(`/presentation${noteId ? `?noteId=${noteId}` : ''}`)}
                                className={cn(
                                  "w-full flex items-center justify-center px-6 py-4 text-sm font-bold transition-all active:scale-95 shadow-sm mb-2",
                                  theme === 'modern' && "text-blue-700 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100",
                                  theme === 'professional' && "text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100",
                                  theme === 'cyberpunk' && "text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 rounded-none hover:bg-cyan-900/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-widest",
                                  theme === 'vintage' && "text-[#8b4513] bg-[#fdfbf7] border border-[#d4c5a1] rounded-sm hover:bg-[#f5f0e6]",
                                  theme === 'terminal' && "text-green-400 bg-green-950/30 border border-green-500/30 rounded-none hover:bg-green-900/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] uppercase tracking-widest",
                                  theme === 'ethereal' && "text-indigo-700 bg-indigo-50 border-2 border-indigo-100 rounded-xl hover:bg-indigo-100",
                                  theme === 'prism' && "text-blue-700 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100",
                                  theme === 'minecraft' && "text-white bg-[#8b8b8b] border-2 border-b-4 border-r-4 border-[#373737] rounded-none hover:bg-[#9b9b9b] font-pixel text-[10px] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2",
                                  theme === 'undertale' && "text-white bg-black border-2 border-white rounded-none hover:bg-gray-900 font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700] bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none hover:bg-[#3a3a3a] font-serif uppercase tracking-widest",
                                  theme === 'cuphead' && "text-black bg-[#e8e8d0] border-2 border-black rounded-none hover:bg-[#d8d8c0] font-black uppercase tracking-widest",
                                  theme === 'comic' && "text-black bg-yellow-100 border-2 border-black rounded-none hover:bg-yellow-200 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                )}
                              >
                                <Play className={cn(
                                  "w-5 h-5 mr-2",
                                  theme === 'modern' && "text-blue-500",
                                  theme === 'professional' && "text-slate-500",
                                  theme === 'cyberpunk' && "text-cyan-400",
                                  theme === 'vintage' && "text-[#8b4513]",
                                  theme === 'terminal' && "text-green-400",
                                  theme === 'ethereal' && "text-indigo-500",
                                  theme === 'prism' && "text-blue-500",
                                  theme === 'minecraft' && "text-white",
                                  theme === 'undertale' && "text-white",
                                  theme === 'god-of-war' && "text-[#ffd700]",
                                  theme === 'cuphead' && "text-black",
                                  theme === 'comic' && "text-black"
                                )} />
                                Presentation View
                              </button>

                              <button 
                                onClick={() => navigate(`/fluid${noteId ? `?noteId=${noteId}` : ''}`)}
                                className={cn(
                                  "w-full flex items-center justify-center px-6 py-4 text-sm font-bold transition-all active:scale-95 shadow-sm mb-2",
                                  theme === 'modern' && "text-emerald-700 bg-emerald-50 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-100",
                                  theme === 'professional' && "text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100",
                                  theme === 'cyberpunk' && "text-fuchsia-400 bg-fuchsia-950/30 border border-fuchsia-500/30 rounded-none hover:bg-fuchsia-900/50 hover:shadow-[0_0_15px_rgba(232,121,249,0.3)] uppercase tracking-widest",
                                  theme === 'vintage' && "text-[#8b4513] bg-[#fdfbf7] border border-[#d4c5a1] rounded-sm hover:bg-[#f5f0e6]",
                                  theme === 'terminal' && "text-green-400 bg-green-950/30 border border-green-500/30 rounded-none hover:bg-green-900/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] uppercase tracking-widest",
                                  theme === 'ethereal' && "text-purple-700 bg-purple-50 border-2 border-purple-100 rounded-xl hover:bg-purple-100",
                                  theme === 'prism' && "text-emerald-700 bg-emerald-50 border-2 border-emerald-100 rounded-2xl hover:bg-emerald-100",
                                  theme === 'minecraft' && "text-white bg-[#8b8b8b] border-2 border-b-4 border-r-4 border-[#373737] rounded-none hover:bg-[#9b9b9b] font-pixel text-[10px] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2",
                                  theme === 'undertale' && "text-white bg-black border-2 border-white rounded-none hover:bg-gray-900 font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700] bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none hover:bg-[#3a3a3a] font-serif uppercase tracking-widest",
                                  theme === 'cuphead' && "text-black bg-[#e8e8d0] border-2 border-black rounded-none hover:bg-[#d8d8c0] font-black uppercase tracking-widest",
                                  theme === 'comic' && "text-black bg-yellow-100 border-2 border-black rounded-none hover:bg-yellow-200 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                )}
                              >
                                <Sparkles className={cn(
                                  "w-5 h-5 mr-2",
                                  theme === 'modern' && "text-emerald-500",
                                  theme === 'professional' && "text-slate-500",
                                  theme === 'cyberpunk' && "text-fuchsia-400",
                                  theme === 'vintage' && "text-[#8b4513]",
                                  theme === 'terminal' && "text-green-400",
                                  theme === 'ethereal' && "text-purple-500",
                                  theme === 'prism' && "text-emerald-500",
                                  theme === 'minecraft' && "text-white",
                                  theme === 'undertale' && "text-white",
                                  theme === 'god-of-war' && "text-[#ffd700]",
                                  theme === 'cuphead' && "text-black",
                                  theme === 'comic' && "text-black"
                                )} />
                                Enter Fluid Mode
                              </button>

                              <button 
                                onClick={() => {
                                  setIsSettingsOpen(false);
                                  setIsSaveModalOpen(true);
                                }}
                                disabled={!parsedData}
                                className={cn(
                                  "w-full flex items-center justify-center px-6 py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4",
                                  theme === 'modern' && "text-blue-700 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100 shadow-sm",
                                  theme === 'professional' && "text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 shadow-sm",
                                  theme === 'cyberpunk' && "text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 rounded-none hover:bg-cyan-900/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-widest",
                                  theme === 'vintage' && "text-[#8b4513] bg-[#fdfbf7] border border-[#d4c5a1] rounded-sm hover:bg-[#f5f0e6] shadow-sm",
                                  theme === 'terminal' && "text-green-400 bg-green-950/30 border border-green-500/30 rounded-none hover:bg-green-900/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] uppercase tracking-widest",
                                  theme === 'ethereal' && "text-indigo-700 bg-indigo-50 border-2 border-indigo-100 rounded-xl hover:bg-indigo-100 shadow-sm",
                                  theme === 'prism' && "text-blue-700 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100 shadow-sm",
                                  theme === 'minecraft' && "text-white bg-[#8b8b8b] border-2 border-b-4 border-r-4 border-[#373737] rounded-none hover:bg-[#9b9b9b] font-pixel text-[10px] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2",
                                  theme === 'undertale' && "text-white bg-black border-2 border-white rounded-none hover:bg-gray-900 font-retro",
                                  theme === 'god-of-war' && "text-[#ffd700] bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none hover:bg-[#3a3a3a] font-serif uppercase tracking-widest",
                                  theme === 'cuphead' && "text-black bg-[#e8e8d0] border-2 border-black rounded-none hover:bg-[#d8d8c0] font-black uppercase tracking-widest",
                                  theme === 'comic' && "text-black bg-yellow-100 border-2 border-black rounded-none hover:bg-yellow-200 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                )}
                              >
                                <Save className={cn(
                                  "w-5 h-5 mr-2",
                                  theme === 'modern' && "text-blue-500",
                                  theme === 'professional' && "text-slate-500",
                                  theme === 'cyberpunk' && "text-cyan-400",
                                  theme === 'vintage' && "text-[#8b4513]",
                                  theme === 'terminal' && "text-green-400",
                                  theme === 'ethereal' && "text-indigo-500",
                                  theme === 'prism' && "text-blue-500",
                                  theme === 'minecraft' && "text-white",
                                  theme === 'undertale' && "text-white",
                                  theme === 'god-of-war' && "text-[#ffd700]",
                                  theme === 'cuphead' && "text-black",
                                  theme === 'comic' && "text-black"
                                )} />
                                Save Note
                              </button>

                              <button 
                                onClick={async () => {
                                  setIsGenerating(true);
                                  setIsSettingsOpen(false);
                                  try {
                                    await generatePDF(
                                      parsedData, 
                                      imagePlacements, 
                                      selectedColors, 
                                      textSize,
                                      uploadedFonts.find(f => f.name === selectedFont),
                                      theme
                                    );
                                  } catch (err) {
                                    console.error("PDF Export failed:", err);
                                    alert("Failed to export PDF. Check console for details.");
                                  } finally {
                                    setIsGenerating(false);
                                  }
                                }}
                                disabled={isGenerating || !parsedData}
                                className={cn(
                                  "w-full flex items-center justify-center px-6 py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                  theme === 'modern' && "text-white bg-orange-600 rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-100",
                                  theme === 'professional' && "text-white bg-slate-800 rounded-md hover:bg-slate-900 shadow-md",
                                  theme === 'cyberpunk' && "text-black bg-orange-500 rounded-none hover:bg-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.8)] uppercase tracking-widest",
                                  theme === 'vintage' && "text-[#fdfbf7] bg-[#8b4513] rounded-sm hover:bg-[#6b3410]",
                                  theme === 'terminal' && "text-black bg-green-500 rounded-none hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)] uppercase tracking-widest",
                                  theme === 'ethereal' && "text-white bg-orange-500 rounded-xl hover:bg-orange-600 shadow-lg",
                                  theme === 'prism' && "text-white bg-orange-600 rounded-2xl hover:bg-orange-700 shadow-lg shadow-orange-100",
                                  theme === 'minecraft' && "text-white bg-[#4CAF50] border-2 border-b-4 border-r-4 border-[#2E7D32] rounded-none hover:bg-[#45a049] font-pixel text-[10px] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2",
                                  theme === 'undertale' && "text-black bg-yellow-400 border-2 border-white rounded-none hover:bg-yellow-300 font-retro",
                                  theme === 'god-of-war' && "text-black bg-[#ffd700] border border-[#8b0000] rounded-none hover:bg-[#ffed4a] font-serif uppercase tracking-widest",
                                  theme === 'cuphead' && "text-[#e8e8d0] bg-black border-2 border-black rounded-none hover:bg-gray-800 font-black uppercase tracking-widest",
                                  theme === 'comic' && "text-black bg-orange-400 border-2 border-black rounded-none hover:bg-orange-300 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                )}
                              >
                                {isGenerating ? (
                                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <Download className="w-5 h-5 mr-2" />
                                )}
                                Export PDF Now
                              </button>

                              <button 
                                onClick={async () => {
                                  setIsGenerating(true);
                                  setIsSettingsOpen(false);
                                  try {
                                    await exportToHTML(
                                      parsedData, 
                                      imagePlacements, 
                                      selectedColors, 
                                      textSize,
                                      uploadedFonts.find(f => f.name === selectedFont),
                                      theme,
                                      videoBackgroundEnabled,
                                      customVideoUrl,
                                      videoBackgroundBase64,
                                      overlayVideos
                                    );
                                  } catch (err) {
                                    console.error("HTML Export failed:", err);
                                    alert("Failed to export HTML. Check console for details.");
                                  } finally {
                                    setIsGenerating(false);
                                  }
                                }}
                                disabled={isGenerating || !parsedData}
                                className={cn(
                                  "w-full flex items-center justify-center px-6 py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                  theme === 'modern' && "text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100",
                                  theme === 'professional' && "text-white bg-slate-800 rounded-md hover:bg-slate-900 shadow-md",
                                  theme === 'cyberpunk' && "text-black bg-cyan-400 rounded-none hover:bg-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.8)] uppercase tracking-widest",
                                  theme === 'vintage' && "text-[#fdfbf7] bg-[#8b4513] rounded-sm hover:bg-[#6b3410]",
                                  theme === 'terminal' && "text-black bg-green-500 rounded-none hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)] uppercase tracking-widest",
                                  theme === 'ethereal' && "text-white bg-indigo-500 rounded-xl hover:bg-indigo-600 shadow-lg",
                                  theme === 'prism' && "text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100",
                                  theme === 'minecraft' && "text-white bg-[#2196F3] border-2 border-b-4 border-r-4 border-[#1565C0] rounded-none hover:bg-[#1E88E5] font-pixel text-[10px] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2",
                                  theme === 'undertale' && "text-black bg-white border-2 border-white rounded-none hover:bg-gray-200 font-retro",
                                  theme === 'god-of-war' && "text-black bg-[#ffd700] border border-[#8b0000] rounded-none hover:bg-[#ffed4a] font-serif uppercase tracking-widest",
                                  theme === 'cuphead' && "text-[#e8e8d0] bg-black border-2 border-black rounded-none hover:bg-gray-800 font-black uppercase tracking-widest",
                                  theme === 'comic' && "text-black bg-blue-400 border-2 border-black rounded-none hover:bg-blue-300 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                )}
                              >
                                {isGenerating ? (
                                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <FileCode className="w-5 h-5 mr-2" />
                                )}
                                Download HTML
                              </button>

                              <button 
                                onClick={async () => {
                                  setIsGenerating(true);
                                  setIsSettingsOpen(false);
                                  try {
                                    await exportToHTML(
                                      parsedData, 
                                      imagePlacements, 
                                      selectedColors, 
                                      textSize,
                                      uploadedFonts.find(f => f.name === selectedFont),
                                      theme,
                                      videoBackgroundEnabled,
                                      customVideoUrl,
                                      videoBackgroundBase64,
                                      overlayVideos,
                                      'print'
                                    );
                                  } catch (err) {
                                    console.error("Print Preview failed:", err);
                                    alert("Failed to generate print preview. Check console for details.");
                                  } finally {
                                    setIsGenerating(false);
                                  }
                                }}
                                disabled={isGenerating || !parsedData}
                                className={cn(
                                  "w-full flex items-center justify-center px-6 py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                  theme === 'modern' && "text-white bg-purple-600 rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-100",
                                  theme === 'professional' && "text-white bg-slate-800 rounded-md hover:bg-slate-900 shadow-md",
                                  theme === 'cyberpunk' && "text-black bg-fuchsia-500 rounded-none hover:bg-fuchsia-400 hover:shadow-[0_0_15px_rgba(217,70,239,0.8)] uppercase tracking-widest",
                                  theme === 'vintage' && "text-[#fdfbf7] bg-[#8b4513] rounded-sm hover:bg-[#6b3410]",
                                  theme === 'terminal' && "text-black bg-green-500 rounded-none hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)] uppercase tracking-widest",
                                  theme === 'ethereal' && "text-white bg-purple-500 rounded-xl hover:bg-purple-600 shadow-lg",
                                  theme === 'prism' && "text-white bg-purple-600 rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-100",
                                  theme === 'minecraft' && "text-white bg-[#9C27B0] border-2 border-b-4 border-r-4 border-[#7B1FA2] rounded-none hover:bg-[#AB47BC] font-pixel text-[10px] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2",
                                  theme === 'undertale' && "text-black bg-purple-400 border-2 border-white rounded-none hover:bg-purple-300 font-retro",
                                  theme === 'god-of-war' && "text-black bg-[#ffd700] border border-[#8b0000] rounded-none hover:bg-[#ffed4a] font-serif uppercase tracking-widest",
                                  theme === 'cuphead' && "text-[#e8e8d0] bg-black border-2 border-black rounded-none hover:bg-gray-800 font-black uppercase tracking-widest",
                                  theme === 'comic' && "text-black bg-purple-400 border-2 border-black rounded-none hover:bg-purple-300 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                                )}
                              >
                                {isGenerating ? (
                                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <Printer className="w-5 h-5 mr-2" />
                                )}
                                Print Document Preview
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Prompt Configuration Modal */}
      <AnimatePresence>
        {isPromptModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPromptModalOpen(false)}
              className={cn(
                "fixed inset-0 backdrop-blur-sm z-50",
                theme === 'modern' && "bg-slate-900/40",
                theme === 'vintage' && "bg-[#2c241a]/80",
                theme === 'prism' && "bg-slate-900/40",
                theme === 'professional' && "bg-slate-900/70",
                theme === 'cyberpunk' && "bg-black/80",
                theme === 'terminal' && "bg-black/80",
                theme === 'ethereal' && "bg-indigo-900/40",
                theme === 'minecraft' && "bg-black/60",
                theme === 'undertale' && "bg-black/90",
                theme === 'god-of-war' && "bg-black/80",
                theme === 'cuphead' && "bg-black/60",
                theme === 'comic' && "bg-black/60"
              )}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className={cn(
                "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xl overflow-hidden z-50 flex flex-col max-h-[80vh] prompt-modal-container",
                theme === 'modern' && "bg-white rounded-2xl shadow-2xl border border-slate-200",
                theme === 'vintage' && "bg-[#fdfbf7] rounded-none shadow-[15px_15px_0_rgba(0,0,0,0.1)] border-2 border-[#4a3728]",
                theme === 'prism' && "bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40",
                theme === 'professional' && "bg-white rounded-xl shadow-xl border border-slate-200",
                theme === 'cyberpunk' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] border-2 border-cyan-500",
                theme === 'terminal' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.2)] border-2 border-green-500",
                theme === 'ethereal' && "bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100",
                theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-t-[#ffffff] border-l-[#ffffff] border-b-[#555555] border-r-[#555555] shadow-[8px_8px_0_rgba(0,0,0,0.4)]",
                theme === 'undertale' && "bg-black rounded-none border-4 border-white shadow-[0_0_0_4px_black]",
                theme === 'god-of-war' && "bg-[#1a1a1a] rounded-none border-2 border-[#8b0000] shadow-[0_0_50px_rgba(139,0,0,0.3)]",
                theme === 'cuphead' && "bg-[#f4e4bc] rounded-none border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white rounded-none border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]"
              )}
            >
              <div className={cn(
                "px-5 py-3 border-b flex items-center justify-between",
                theme === 'modern' && "border-slate-100 bg-slate-50",
                theme === 'vintage' && "border-[#4a3728] bg-[#f4f1ea]",
                theme === 'prism' && "border-white/20 bg-white/10",
                theme === 'professional' && "border-slate-100 bg-slate-50",
                theme === 'cyberpunk' && "border-cyan-900 bg-black",
                theme === 'terminal' && "border-green-900 bg-black",
                theme === 'ethereal' && "border-indigo-100 bg-indigo-50/30",
                theme === 'minecraft' && "border-[#1e1e1e] bg-[#1e1e1e]",
                theme === 'undertale' && "border-white/20 bg-black",
                theme === 'god-of-war' && "border-[#8b0000]/30 bg-[#1a1a1a]",
                theme === 'cuphead' && "border-black bg-[#f4e4bc]",
                theme === 'comic' && "border-black bg-white"
              )}>
                <h3 className={cn(
                  "font-bold flex items-center text-sm",
                  theme === 'modern' && "text-slate-800",
                  theme === 'vintage' && "text-[#4a3728] font-serif",
                  theme === 'prism' && "text-slate-800",
                  theme === 'professional' && "text-slate-800",
                  theme === 'cyberpunk' && "text-cyan-400 uppercase tracking-widest",
                  theme === 'terminal' && "text-green-400 font-mono",
                  theme === 'ethereal' && "text-indigo-900",
                  theme === 'minecraft' && "text-white font-mono",
                  theme === 'undertale' && "text-white font-mono",
                  theme === 'god-of-war' && "text-[#e5e5e5] uppercase tracking-[0.2em]",
                  theme === 'cuphead' && "text-black font-black",
                  theme === 'comic' && "text-black font-black italic"
                )}>
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                  Configure AI Prompt
                </h3>
                <button 
                  onClick={() => setIsPromptModalOpen(false)}
                  className={cn(
                    "p-1 transition-colors rounded-full",
                    theme === 'modern' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                    theme === 'vintage' && "text-[#4a3728] hover:bg-[#4a3728]/10",
                    theme === 'prism' && "text-slate-400 hover:text-slate-600 hover:bg-white/40",
                    theme === 'professional' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                    theme === 'cyberpunk' && "text-cyan-400 hover:bg-cyan-500/20",
                    theme === 'terminal' && "text-green-400 hover:bg-green-500/20",
                    theme === 'ethereal' && "text-indigo-400 hover:bg-indigo-50",
                    theme === 'minecraft' && "text-white hover:bg-[#545454]",
                    theme === 'undertale' && "text-white hover:bg-white/10",
                    theme === 'god-of-war' && "text-[#e5e5e5] hover:bg-[#8b0000]/20",
                    theme === 'cuphead' && "text-black hover:bg-black/10",
                    theme === 'comic' && "text-black hover:bg-black/10"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className={cn(
                "p-5 overflow-y-auto flex-1 custom-scrollbar",
                theme === 'modern' && "bg-white",
                theme === 'vintage' && "bg-[#fdfbf7]",
                theme === 'prism' && "bg-white/60",
                theme === 'professional' && "bg-white",
                theme === 'cyberpunk' && "bg-black",
                theme === 'terminal' && "bg-black",
                theme === 'ethereal' && "bg-white/50",
                theme === 'minecraft' && "bg-[#c6c6c6]",
                theme === 'undertale' && "bg-black",
                theme === 'god-of-war' && "bg-[#1a1a1a]",
                theme === 'cuphead' && "bg-[#f4e4bc]",
                theme === 'comic' && "bg-white"
              )}>
                <div className="mb-5">
                  <h4 className={cn(
                    "text-xs font-bold uppercase tracking-wider mb-2",
                    theme === 'modern' && "text-slate-500",
                    theme === 'vintage' && "text-[#4a3728]/60",
                    theme === 'prism' && "text-slate-500",
                    theme === 'professional' && "text-slate-500",
                    theme === 'cyberpunk' && "text-cyan-900",
                    theme === 'terminal' && "text-green-900",
                    theme === 'ethereal' && "text-indigo-400",
                    theme === 'minecraft' && "text-[#545454]",
                    theme === 'undertale' && "text-white/40",
                    theme === 'god-of-war' && "text-[#e5e5e5]/40",
                    theme === 'cuphead' && "text-black/60",
                    theme === 'comic' && "text-black/60"
                  )}>Output Format</h4>
                  <div className={cn(
                    "flex space-x-2 p-1 rounded-lg",
                    theme === 'modern' && "bg-slate-100",
                    theme === 'vintage' && "bg-[#f4f1ea] border-2 border-[#4a3728]",
                    theme === 'prism' && "bg-white/40 border border-white/60",
                    theme === 'professional' && "bg-slate-100",
                    theme === 'cyberpunk' && "bg-black border-2 border-cyan-900",
                    theme === 'terminal' && "bg-black border-2 border-green-900",
                    theme === 'ethereal' && "bg-indigo-50/50 border border-indigo-100",
                    theme === 'minecraft' && "bg-[#1e1e1e] border-2 border-[#545454]",
                    theme === 'undertale' && "bg-black border-2 border-white/20",
                    theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000]/30",
                    theme === 'cuphead' && "bg-[#f4e4bc] border-2 border-black",
                    theme === 'comic' && "bg-white border-2 border-black"
                  )}>
                    <button
                      onClick={() => setPromptFormat('CSV')}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-md font-medium text-sm transition-all",
                        promptFormat === 'CSV'
                          ? (
                              theme === 'modern' ? "bg-white text-purple-700 shadow-sm" :
                              theme === 'professional' ? "bg-slate-800 text-white shadow-sm" :
                              theme === 'cyberpunk' ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,255,255,0.5)]" :
                              theme === 'vintage' ? "bg-[#4a3728] text-[#f4f1ea]" :
                              theme === 'terminal' ? "bg-green-500 text-black shadow-[0_0_10px_rgba(0,255,0,0.5)]" :
                              theme === 'ethereal' ? "bg-indigo-600 text-white shadow-sm" :
                              theme === 'prism' ? "bg-indigo-500 text-white shadow-sm" :
                              theme === 'minecraft' ? "bg-[#545454] text-white" :
                              theme === 'undertale' ? "bg-white text-black" :
                              theme === 'god-of-war' ? "bg-[#8b0000] text-white" :
                              theme === 'cuphead' ? "bg-black text-white" :
                              theme === 'comic' ? "bg-black text-white" :
                              "bg-white text-purple-700 shadow-sm"
                            )
                          : (
                              theme === 'modern' ? "text-slate-600 hover:text-slate-900" :
                              theme === 'professional' ? "text-slate-600 hover:text-slate-900" :
                              theme === 'cyberpunk' ? "text-cyan-900 hover:text-cyan-400" :
                              theme === 'vintage' ? "text-[#4a3728] hover:bg-[#4a3728]/10" :
                              theme === 'terminal' ? "text-green-900 hover:text-green-400" :
                              theme === 'ethereal' ? "text-indigo-300 hover:text-indigo-600" :
                              theme === 'prism' ? "text-slate-600 hover:text-slate-900" :
                              theme === 'minecraft' ? "text-[#545454] hover:text-white" :
                              theme === 'undertale' ? "text-white/40 hover:text-white" :
                              theme === 'god-of-war' ? "text-[#e5e5e5]/40 hover:text-[#e5e5e5]" :
                              theme === 'cuphead' ? "text-black/40 hover:text-black" :
                              theme === 'comic' ? "text-black/40 hover:text-black" :
                              "text-slate-600 hover:text-slate-900"
                            )
                      )}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => setPromptFormat('JSON')}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-md font-medium text-sm transition-all",
                        promptFormat === 'JSON'
                          ? (
                              theme === 'modern' ? "bg-white text-purple-700 shadow-sm" :
                              theme === 'professional' ? "bg-slate-800 text-white shadow-sm" :
                              theme === 'cyberpunk' ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(0,255,255,0.5)]" :
                              theme === 'vintage' ? "bg-[#4a3728] text-[#f4f1ea]" :
                              theme === 'terminal' ? "bg-green-500 text-black shadow-[0_0_10px_rgba(0,255,0,0.5)]" :
                              theme === 'ethereal' ? "bg-indigo-600 text-white shadow-sm" :
                              theme === 'prism' ? "bg-indigo-500 text-white shadow-sm" :
                              theme === 'minecraft' ? "bg-[#545454] text-white" :
                              theme === 'undertale' ? "bg-white text-black" :
                              theme === 'god-of-war' ? "bg-[#8b0000] text-white" :
                              theme === 'cuphead' ? "bg-black text-white" :
                              theme === 'comic' ? "bg-black text-white" :
                              "bg-white text-purple-700 shadow-sm"
                            )
                          : (
                              theme === 'modern' ? "text-slate-600 hover:text-slate-900" :
                              theme === 'professional' ? "text-slate-600 hover:text-slate-900" :
                              theme === 'cyberpunk' ? "text-cyan-900 hover:text-cyan-400" :
                              theme === 'vintage' ? "text-[#4a3728] hover:bg-[#4a3728]/10" :
                              theme === 'terminal' ? "text-green-900 hover:text-green-400" :
                              theme === 'ethereal' ? "text-indigo-300 hover:text-indigo-600" :
                              theme === 'prism' ? "text-slate-600 hover:text-slate-900" :
                              theme === 'minecraft' ? "text-[#545454] hover:text-white" :
                              theme === 'undertale' ? "text-white/40 hover:text-white" :
                              theme === 'god-of-war' ? "text-[#e5e5e5]/40 hover:text-[#e5e5e5]" :
                              theme === 'cuphead' ? "text-black/40 hover:text-black" :
                              theme === 'comic' ? "text-black/40 hover:text-black" :
                              "text-slate-600 hover:text-slate-900"
                            )
                      )}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <h4 className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    theme === 'modern' && "text-slate-500",
                    theme === 'vintage' && "text-[#4a3728]/60",
                    theme === 'prism' && "text-slate-500",
                    theme === 'professional' && "text-slate-500",
                    theme === 'cyberpunk' && "text-cyan-900",
                    theme === 'terminal' && "text-green-900",
                    theme === 'ethereal' && "text-indigo-400",
                    theme === 'minecraft' && "text-[#545454]",
                    theme === 'undertale' && "text-white/40",
                    theme === 'god-of-war' && "text-[#e5e5e5]/40",
                    theme === 'cuphead' && "text-black/60",
                    theme === 'comic' && "text-black/60"
                  )}>Content Types</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedPromptTypes(AVAILABLE_TYPES.map(t => t.id))}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors",
                        theme === 'modern' && "text-blue-600 hover:text-blue-700",
                        theme === 'vintage' && "text-[#4a3728] hover:underline",
                        theme === 'prism' && "text-indigo-600 hover:text-indigo-700",
                        theme === 'professional' && "text-slate-800 hover:text-black",
                        theme === 'cyberpunk' && "text-cyan-400 hover:text-cyan-300",
                        theme === 'terminal' && "text-green-400 hover:text-green-300",
                        theme === 'ethereal' && "text-indigo-600 hover:text-indigo-700",
                        theme === 'minecraft' && "text-white hover:underline",
                        theme === 'undertale' && "text-white hover:underline",
                        theme === 'god-of-war' && "text-[#8b0000] hover:text-[#a00000]",
                        theme === 'cuphead' && "text-black hover:underline",
                        theme === 'comic' && "text-black hover:underline"
                      )}
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={() => setSelectedPromptTypes([])}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider transition-colors",
                        theme === 'modern' && "text-slate-400 hover:text-red-500",
                        theme === 'vintage' && "text-[#4a3728]/40 hover:text-red-600",
                        theme === 'prism' && "text-slate-400 hover:text-red-500",
                        theme === 'professional' && "text-slate-400 hover:text-red-500",
                        theme === 'cyberpunk' && "text-cyan-900 hover:text-red-500",
                        theme === 'terminal' && "text-green-900 hover:text-red-500",
                        theme === 'ethereal' && "text-indigo-300 hover:text-red-500",
                        theme === 'minecraft' && "text-[#545454] hover:text-red-500",
                        theme === 'undertale' && "text-white/20 hover:text-red-500",
                        theme === 'god-of-war' && "text-[#e5e5e5]/20 hover:text-red-500",
                        theme === 'cuphead' && "text-black/20 hover:text-red-500",
                        theme === 'comic' && "text-black/20 hover:text-red-500"
                      )}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {AVAILABLE_TYPES.map(type => {
                    const isSelected = selectedPromptTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        onClick={() => togglePromptType(type.id)}
                        className={cn(
                          "flex items-center p-2 rounded-lg border text-left transition-all prompt-type-button",
                          isSelected 
                            ? (
                                theme === 'modern' ? "border-purple-200 bg-purple-50 prompt-type-button-selected" :
                                theme === 'professional' ? "border-slate-800 bg-slate-50 prompt-type-button-selected" :
                                theme === 'cyberpunk' ? "border-cyan-500 bg-cyan-500/10 prompt-type-button-selected shadow-[0_0_10px_rgba(0,255,255,0.2)]" :
                                theme === 'vintage' ? "border-[#4a3728] bg-[#4a3728]/10 prompt-type-button-selected" :
                                theme === 'terminal' ? "border-green-500 bg-green-500/10 prompt-type-button-selected shadow-[0_0_10px_rgba(0,255,0,0.2)]" :
                                theme === 'ethereal' ? "border-indigo-200 bg-indigo-50 prompt-type-button-selected" :
                                theme === 'prism' ? "border-indigo-200 bg-indigo-50 prompt-type-button-selected" :
                                theme === 'minecraft' ? "border-white bg-white/10 prompt-type-button-selected" :
                                theme === 'undertale' ? "border-white bg-white/10 prompt-type-button-selected" :
                                theme === 'god-of-war' ? "border-[#8b0000] bg-[#8b0000]/10 prompt-type-button-selected" :
                                theme === 'cuphead' ? "border-black bg-black/10 prompt-type-button-selected" :
                                theme === 'comic' ? "border-black bg-black/10 prompt-type-button-selected" :
                                "border-purple-200 bg-purple-50 prompt-type-button-selected"
                              )
                            : (
                                theme === 'modern' ? "border-slate-100 hover:border-purple-200 hover:bg-slate-50" :
                                theme === 'professional' ? "border-slate-100 hover:border-slate-800 hover:bg-slate-50" :
                                theme === 'cyberpunk' ? "border-cyan-900/30 hover:border-cyan-500 hover:bg-cyan-500/5" :
                                theme === 'vintage' ? "border-[#4a3728]/20 hover:border-[#4a3728] hover:bg-[#4a3728]/5" :
                                theme === 'terminal' ? "border-green-900/30 hover:border-green-500 hover:bg-green-500/5" :
                                theme === 'ethereal' ? "border-indigo-50 hover:border-indigo-200 hover:bg-indigo-50/50" :
                                theme === 'prism' ? "border-white/20 hover:border-indigo-200 hover:bg-white/40" :
                                theme === 'minecraft' ? "border-[#545454] hover:border-white hover:bg-white/5" :
                                theme === 'undertale' ? "border-white/20 hover:border-white hover:bg-white/5" :
                                theme === 'god-of-war' ? "border-[#8b0000]/20 hover:border-[#8b0000] hover:bg-[#8b0000]/5" :
                                theme === 'cuphead' ? "border-black/20 hover:border-black hover:bg-black/5" :
                                theme === 'comic' ? "border-black/20 hover:border-black hover:bg-black/5" :
                                "border-slate-100 hover:border-purple-200 hover:bg-slate-50"
                              )
                        )}
                      >
                        <div className="mr-2 flex-shrink-0 prompt-type-icon">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={cn(
                            "font-semibold text-xs truncate prompt-type-title",
                            isSelected 
                              ? (
                                  theme === 'modern' ? "text-purple-900" :
                                  theme === 'professional' ? "text-slate-900" :
                                  theme === 'cyberpunk' ? "text-cyan-400" :
                                  theme === 'vintage' ? "text-[#4a3728]" :
                                  theme === 'terminal' ? "text-green-400" :
                                  theme === 'ethereal' ? "text-indigo-900" :
                                  theme === 'prism' ? "text-indigo-900" :
                                  theme === 'minecraft' ? "text-white" :
                                  theme === 'undertale' ? "text-white" :
                                  theme === 'god-of-war' ? "text-white" :
                                  theme === 'cuphead' ? "text-black" :
                                  theme === 'comic' ? "text-black" :
                                  "text-purple-900"
                                )
                              : (
                                  theme === 'modern' ? "text-slate-700" :
                                  theme === 'professional' ? "text-slate-700" :
                                  theme === 'cyberpunk' ? "text-cyan-900" :
                                  theme === 'vintage' ? "text-[#4a3728]/60" :
                                  theme === 'terminal' ? "text-green-900" :
                                  theme === 'ethereal' ? "text-indigo-400" :
                                  theme === 'prism' ? "text-slate-700" :
                                  theme === 'minecraft' ? "text-[#545454]" :
                                  theme === 'undertale' ? "text-white/40" :
                                  theme === 'god-of-war' ? "text-[#e5e5e5]/40" :
                                  theme === 'cuphead' ? "text-black/40" :
                                  theme === 'comic' ? "text-black/40" :
                                  "text-slate-700"
                                )
                          )}>
                            {type.id}
                          </div>
                          <div className={cn(
                            "text-[10px] truncate prompt-type-description",
                            isSelected 
                              ? (
                                  theme === 'modern' ? "text-purple-600/80" :
                                  theme === 'professional' ? "text-slate-500" :
                                  theme === 'cyberpunk' ? "text-cyan-400/60" :
                                  theme === 'vintage' ? "text-[#4a3728]/80" :
                                  theme === 'terminal' ? "text-green-400/60" :
                                  theme === 'ethereal' ? "text-indigo-600/80" :
                                  theme === 'prism' ? "text-indigo-600/80" :
                                  theme === 'minecraft' ? "text-white/60" :
                                  theme === 'undertale' ? "text-white/60" :
                                  theme === 'god-of-war' ? "text-white/60" :
                                  theme === 'cuphead' ? "text-black/60" :
                                  theme === 'comic' ? "text-black/60" :
                                  "text-purple-600/80"
                                )
                              : (
                                  theme === 'modern' ? "text-slate-400" :
                                  theme === 'professional' ? "text-slate-400" :
                                  theme === 'cyberpunk' ? "text-cyan-900/40" :
                                  theme === 'vintage' ? "text-[#4a3728]/40" :
                                  theme === 'terminal' ? "text-green-900/40" :
                                  theme === 'ethereal' ? "text-indigo-300" :
                                  theme === 'prism' ? "text-slate-400" :
                                  theme === 'minecraft' ? "text-[#545454]/40" :
                                  theme === 'undertale' ? "text-white/20" :
                                  theme === 'god-of-war' ? "text-[#e5e5e5]/20" :
                                  theme === 'cuphead' ? "text-black/20" :
                                  theme === 'comic' ? "text-black/20" :
                                  "text-slate-400"
                                )
                          )}>
                            {type.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className={cn(
                  "p-4 rounded-xl border",
                  theme === 'modern' && "bg-purple-50 border-purple-100",
                  theme === 'vintage' && "bg-[#f4f1ea] border-[#4a3728]",
                  theme === 'prism' && "bg-indigo-50/50 border-indigo-100",
                  theme === 'professional' && "bg-slate-50 border-slate-200",
                  theme === 'cyberpunk' && "bg-cyan-500/5 border-cyan-500/30",
                  theme === 'terminal' && "bg-green-500/5 border-green-500/30",
                  theme === 'ethereal' && "bg-indigo-50/50 border-indigo-100",
                  theme === 'minecraft' && "bg-[#1e1e1e] border-[#545454]",
                  theme === 'undertale' && "bg-black border-white/20",
                  theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                  theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                  theme === 'comic' && "bg-white border-black"
                )}>
                  <h5 className={cn(
                    "text-xs font-bold uppercase tracking-wider mb-2 flex items-center",
                    theme === 'modern' && "text-purple-800",
                    theme === 'vintage' && "text-[#4a3728]",
                    theme === 'prism' && "text-indigo-800",
                    theme === 'professional' && "text-slate-800",
                    theme === 'cyberpunk' && "text-cyan-400",
                    theme === 'terminal' && "text-green-400",
                    theme === 'ethereal' && "text-indigo-900",
                    theme === 'minecraft' && "text-white",
                    theme === 'undertale' && "text-white",
                    theme === 'god-of-war' && "text-[#e5e5e5]",
                    theme === 'cuphead' && "text-black",
                    theme === 'comic' && "text-black"
                  )}>
                    <Brain className="w-3 h-3 mr-1" />
                    Pro Tip for AI
                  </h5>
                  <p className={cn(
                    "text-[10px] leading-relaxed",
                    theme === 'modern' && "text-purple-700",
                    theme === 'vintage' && "text-[#4a3728]/80",
                    theme === 'prism' && "text-indigo-700",
                    theme === 'professional' && "text-slate-600",
                    theme === 'cyberpunk' && "text-cyan-400/80",
                    theme === 'terminal' && "text-green-400/80",
                    theme === 'ethereal' && "text-indigo-700",
                    theme === 'minecraft' && "text-[#545454]",
                    theme === 'undertale' && "text-white/60",
                    theme === 'god-of-war' && "text-[#e5e5e5]/60",
                    theme === 'cuphead' && "text-black/80",
                    theme === 'comic' && "text-black/80"
                  )}>
                    The generated prompt includes specific instructions for interactive popovers, memory links, and Egyptian dialect explanations. For best results, use a model like <b>GPT-4o</b> or <b>Claude 3.5 Sonnet</b>.
                  </p>
                </div>
              </div>
              <div className={cn(
                "p-4 border-t flex justify-end items-center",
                theme === 'modern' && "border-slate-100 bg-slate-50",
                theme === 'vintage' && "border-[#4a3728] bg-[#f4f1ea]",
                theme === 'prism' && "border-white/20 bg-white/10",
                theme === 'professional' && "border-slate-100 bg-slate-50",
                theme === 'cyberpunk' && "border-cyan-900 bg-black",
                theme === 'terminal' && "border-green-900 bg-black",
                theme === 'ethereal' && "border-indigo-100 bg-indigo-50/30",
                theme === 'minecraft' && "border-[#1e1e1e] bg-[#1e1e1e]",
                theme === 'undertale' && "border-white/20 bg-black",
                theme === 'god-of-war' && "border-[#8b0000]/30 bg-[#1a1a1a]",
                theme === 'cuphead' && "border-black bg-[#f4e4bc]",
                theme === 'comic' && "border-black bg-white"
              )}>
                <button
                  onClick={handleCopyPrompt}
                  disabled={selectedPromptTypes.length === 0}
                  className={cn(
                    "flex items-center px-5 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm prompt-copy-button active:scale-95",
                    theme === 'modern' && "bg-purple-600 hover:bg-purple-700 text-white rounded-lg",
                    theme === 'professional' && "bg-slate-900 hover:bg-slate-800 text-white rounded-lg",
                    theme === 'cyberpunk' && "bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg",
                    theme === 'vintage' && "bg-[#4a3728] hover:bg-[#4a3728]/90 text-[#f4f1ea] rounded-none",
                    theme === 'terminal' && "bg-green-500 hover:bg-green-400 text-black rounded-lg",
                    theme === 'ethereal' && "bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl",
                    theme === 'prism' && "bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl",
                    theme === 'minecraft' && "bg-[#545454] text-white hover:bg-[#373737] border-b-4 border-[#1e1e1e] rounded-none",
                    theme === 'undertale' && "bg-white text-black hover:bg-white/90 rounded-none",
                    theme === 'god-of-war' && "bg-[#8b0000] hover:bg-[#a00000] text-white rounded-none",
                    theme === 'cuphead' && "bg-black hover:bg-black/90 text-white rounded-none",
                    theme === 'comic' && "bg-black hover:bg-black/90 text-white rounded-none"
                  )}
                >
                  {isPromptCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" /> Copied!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" /> Copy Prompt
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}

        {reorderGroupIndex !== null && parsedData && parsedData[reorderGroupIndex] && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReorderGroupIndex(null)}
              className={cn(
                "fixed inset-0 backdrop-blur-sm z-50",
                theme === 'modern' && "bg-slate-900/40",
                theme === 'vintage' && "bg-[#2c241a]/80",
                theme === 'prism' && "bg-slate-900/40",
                theme === 'professional' && "bg-slate-900/70",
                theme === 'cyberpunk' && "bg-black/80",
                theme === 'terminal' && "bg-black/80",
                theme === 'ethereal' && "bg-indigo-900/40",
                theme === 'minecraft' && "bg-black/60",
                theme === 'undertale' && "bg-black/90",
                theme === 'god-of-war' && "bg-black/80",
                theme === 'cuphead' && "bg-black/60",
                theme === 'comic' && "bg-black/60"
              )}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className={cn(
                "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md overflow-hidden z-50 flex flex-col max-h-[80vh]",
                theme === 'modern' && "bg-white rounded-2xl shadow-2xl border border-slate-200",
                theme === 'vintage' && "bg-[#fdfbf7] rounded-none shadow-[15px_15px_0_rgba(0,0,0,0.1)] border-2 border-[#4a3728]",
                theme === 'prism' && "bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40",
                theme === 'professional' && "bg-white rounded-xl shadow-xl border border-slate-200",
                theme === 'cyberpunk' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] border-2 border-cyan-500",
                theme === 'terminal' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.2)] border-2 border-green-500",
                theme === 'ethereal' && "bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100",
                theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-t-[#ffffff] border-l-[#ffffff] border-b-[#555555] border-r-[#555555] shadow-[8px_8px_0_rgba(0,0,0,0.4)]",
                theme === 'undertale' && "bg-black rounded-none border-4 border-white shadow-[0_0_0_4px_black]",
                theme === 'god-of-war' && "bg-[#1a1a1a] rounded-none border-2 border-[#8b0000] shadow-[0_0_50px_rgba(139,0,0,0.3)]",
                theme === 'cuphead' && "bg-[#f4e4bc] rounded-none border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white rounded-none border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]"
              )}
            >
              <div className={cn(
                "px-5 py-3 border-b flex items-center justify-between",
                theme === 'modern' && "border-slate-100 bg-slate-50",
                theme === 'vintage' && "border-[#4a3728] bg-[#f4f1ea]",
                theme === 'prism' && "border-white/20 bg-white/10",
                theme === 'professional' && "border-slate-100 bg-slate-50",
                theme === 'cyberpunk' && "border-cyan-900 bg-black",
                theme === 'terminal' && "border-green-900 bg-black",
                theme === 'ethereal' && "border-indigo-100 bg-indigo-50/30",
                theme === 'minecraft' && "border-[#1e1e1e] bg-[#1e1e1e]",
                theme === 'undertale' && "border-white/20 bg-black",
                theme === 'god-of-war' && "border-[#8b0000]/30 bg-[#1a1a1a]",
                theme === 'cuphead' && "border-black bg-[#f4e4bc]",
                theme === 'comic' && "border-black bg-white"
              )}>
                <h3 className={cn(
                  "font-bold flex items-center text-sm",
                  theme === 'modern' && "text-slate-800",
                  theme === 'vintage' && "text-[#4a3728] font-serif",
                  theme === 'prism' && "text-slate-800",
                  theme === 'professional' && "text-slate-800",
                  theme === 'cyberpunk' && "text-cyan-400 uppercase tracking-widest",
                  theme === 'terminal' && "text-green-400 font-mono",
                  theme === 'ethereal' && "text-indigo-900",
                  theme === 'minecraft' && "text-white font-mono",
                  theme === 'undertale' && "text-white font-mono",
                  theme === 'god-of-war' && "text-[#e5e5e5] uppercase tracking-[0.2em]",
                  theme === 'cuphead' && "text-black font-black",
                  theme === 'comic' && "text-black font-black italic"
                )}>
                  <Settings className="w-4 h-4 mr-2 text-blue-500" />
                  Reorder: {parsedData[reorderGroupIndex].GROUP}
                </h3>
                <button 
                  onClick={() => setReorderGroupIndex(null)}
                  className={cn(
                    "p-1 transition-colors rounded-full",
                    theme === 'modern' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                    theme === 'vintage' && "text-[#4a3728] hover:bg-[#4a3728]/10",
                    theme === 'prism' && "text-slate-400 hover:text-slate-600 hover:bg-white/40",
                    theme === 'professional' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                    theme === 'cyberpunk' && "text-cyan-400 hover:bg-cyan-500/20",
                    theme === 'terminal' && "text-green-400 hover:bg-green-500/20",
                    theme === 'ethereal' && "text-indigo-400 hover:bg-indigo-50",
                    theme === 'minecraft' && "text-white hover:bg-[#545454]",
                    theme === 'undertale' && "text-white hover:bg-white/10",
                    theme === 'god-of-war' && "text-[#e5e5e5] hover:bg-[#8b0000]/20",
                    theme === 'cuphead' && "text-black hover:bg-black/10",
                    theme === 'comic' && "text-black hover:bg-black/10"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className={cn(
                "p-5 overflow-y-auto flex-1 custom-scrollbar",
                theme === 'modern' && "bg-white",
                theme === 'vintage' && "bg-[#fdfbf7]",
                theme === 'prism' && "bg-white/60",
                theme === 'professional' && "bg-white",
                theme === 'cyberpunk' && "bg-black",
                theme === 'terminal' && "bg-black",
                theme === 'ethereal' && "bg-white/50",
                theme === 'minecraft' && "bg-[#c6c6c6]",
                theme === 'undertale' && "bg-black",
                theme === 'god-of-war' && "bg-[#1a1a1a]",
                theme === 'cuphead' && "bg-[#f4e4bc]",
                theme === 'comic' && "bg-white"
              )}>
                <div className="flex flex-col gap-2">
                  {parsedData[reorderGroupIndex].ITEMS.map((item: any, idx: number) => (
                    <div key={item.id} className={cn(
                      "flex items-center justify-between p-3 border",
                      theme === 'modern' && "bg-slate-50 border-slate-200 rounded-lg",
                      theme === 'vintage' && "bg-[#f4f1ea] border-[#4a3728] rounded-none",
                      theme === 'prism' && "bg-white/40 border-white/20 rounded-xl",
                      theme === 'professional' && "bg-slate-50 border-slate-200 rounded-lg",
                      theme === 'cyberpunk' && "bg-black border-cyan-900 rounded-none shadow-[0_0_10px_rgba(0,255,255,0.1)]",
                      theme === 'terminal' && "bg-black border-green-900 rounded-none shadow-[0_0_10px_rgba(0,255,0,0.1)]",
                      theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100 rounded-xl",
                      theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-t-[#555555] border-l-[#555555] border-b-[#ffffff] border-r-[#ffffff] rounded-none",
                      theme === 'undertale' && "bg-black border-2 border-white rounded-none",
                      theme === 'god-of-war' && "bg-[#1a1a1a] border border-[#8b0000]/30 rounded-none",
                      theme === 'cuphead' && "bg-[#f4e4bc] border-2 border-black rounded-none",
                      theme === 'comic' && "bg-white border-2 border-black rounded-none"
                    )}>
                      <div className="flex flex-col min-w-0 flex-1 mr-4">
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          theme === 'modern' && "text-slate-500",
                          theme === 'vintage' && "text-[#4a3728]/70",
                          theme === 'prism' && "text-slate-500",
                          theme === 'professional' && "text-slate-500",
                          theme === 'cyberpunk' && "text-cyan-400/70",
                          theme === 'terminal' && "text-green-400/70",
                          theme === 'ethereal' && "text-indigo-400",
                          theme === 'minecraft' && "text-[#545454]",
                          theme === 'undertale' && "text-white/70",
                          theme === 'god-of-war' && "text-[#8b0000]/70",
                          theme === 'cuphead' && "text-black/70",
                          theme === 'comic' && "text-black/70"
                        )}>{item.TYPE}</span>
                        <span className={cn(
                          "text-sm truncate",
                          theme === 'modern' && "text-slate-800",
                          theme === 'vintage' && "text-[#4a3728]",
                          theme === 'prism' && "text-slate-800",
                          theme === 'professional' && "text-slate-800",
                          theme === 'cyberpunk' && "text-cyan-400",
                          theme === 'terminal' && "text-green-400 font-mono",
                          theme === 'ethereal' && "text-indigo-900",
                          theme === 'minecraft' && "text-black font-mono",
                          theme === 'undertale' && "text-white font-mono",
                          theme === 'god-of-war' && "text-[#e5e5e5]",
                          theme === 'cuphead' && "text-black font-black",
                          theme === 'comic' && "text-black font-black italic"
                        )}>{item.CONTENT}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            if (idx > 0) {
                              setParsedData((prev: any) => {
                                const newData = [...prev];
                                const group = { ...newData[reorderGroupIndex], ITEMS: [...newData[reorderGroupIndex].ITEMS] };
                                const temp = group.ITEMS[idx];
                                group.ITEMS[idx] = group.ITEMS[idx - 1];
                                group.ITEMS[idx - 1] = temp;
                                newData[reorderGroupIndex] = group;
                                return newData;
                              });
                            }
                          }}
                          disabled={idx === 0}
                          className={cn(
                            "p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                            theme === 'modern' && "bg-slate-200 hover:bg-slate-300 text-slate-700 rounded",
                            theme === 'vintage' && "bg-[#4a3728]/10 hover:bg-[#4a3728]/20 text-[#4a3728] rounded-none",
                            theme === 'prism' && "bg-white/40 hover:bg-white/60 text-slate-700 rounded-lg",
                            theme === 'professional' && "bg-slate-200 hover:bg-slate-300 text-slate-700 rounded",
                            theme === 'cyberpunk' && "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-none border border-cyan-500/30",
                            theme === 'terminal' && "bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-none border border-green-500/30",
                            theme === 'ethereal' && "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg",
                            theme === 'minecraft' && "bg-[#545454] hover:bg-[#373737] text-white rounded-none border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#1e1e1e] border-r-[#1e1e1e]",
                            theme === 'undertale' && "bg-black hover:bg-white/10 text-white rounded-none border border-white",
                            theme === 'god-of-war' && "bg-[#8b0000]/10 hover:bg-[#8b0000]/20 text-[#e5e5e5] rounded-none border border-[#8b0000]/30",
                            theme === 'cuphead' && "bg-black/10 hover:bg-black/20 text-black rounded-none border border-black",
                            theme === 'comic' && "bg-black/10 hover:bg-black/20 text-black rounded-none border-2 border-black"
                          )}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          onClick={() => {
                            if (idx < parsedData[reorderGroupIndex].ITEMS.length - 1) {
                              setParsedData((prev: any) => {
                                const newData = [...prev];
                                const group = { ...newData[reorderGroupIndex], ITEMS: [...newData[reorderGroupIndex].ITEMS] };
                                const temp = group.ITEMS[idx];
                                group.ITEMS[idx] = group.ITEMS[idx + 1];
                                group.ITEMS[idx + 1] = temp;
                                newData[reorderGroupIndex] = group;
                                return newData;
                              });
                            }
                          }}
                          disabled={idx === parsedData[reorderGroupIndex].ITEMS.length - 1}
                          className={cn(
                            "p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                            theme === 'modern' && "bg-slate-200 hover:bg-slate-300 text-slate-700 rounded",
                            theme === 'vintage' && "bg-[#4a3728]/10 hover:bg-[#4a3728]/20 text-[#4a3728] rounded-none",
                            theme === 'prism' && "bg-white/40 hover:bg-white/60 text-slate-700 rounded-lg",
                            theme === 'professional' && "bg-slate-200 hover:bg-slate-300 text-slate-700 rounded",
                            theme === 'cyberpunk' && "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-none border border-cyan-500/30",
                            theme === 'terminal' && "bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-none border border-green-500/30",
                            theme === 'ethereal' && "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg",
                            theme === 'minecraft' && "bg-[#545454] hover:bg-[#373737] text-white rounded-none border-2 border-t-[#ffffff] border-l-[#ffffff] border-b-[#1e1e1e] border-r-[#1e1e1e]",
                            theme === 'undertale' && "bg-black hover:bg-white/10 text-white rounded-none border border-white",
                            theme === 'god-of-war' && "bg-[#8b0000]/10 hover:bg-[#8b0000]/20 text-[#e5e5e5] rounded-none border border-[#8b0000]/30",
                            theme === 'cuphead' && "bg-black/10 hover:bg-black/20 text-black rounded-none border border-black",
                            theme === 'comic' && "bg-black/10 hover:bg-black/20 text-black rounded-none border-2 border-black"
                          )}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={cn(
                "p-4 border-t flex justify-end items-center",
                theme === 'modern' && "border-slate-100 bg-slate-50",
                theme === 'vintage' && "border-[#4a3728] bg-[#f4f1ea]",
                theme === 'prism' && "border-white/20 bg-white/10",
                theme === 'professional' && "border-slate-100 bg-slate-50",
                theme === 'cyberpunk' && "border-cyan-900 bg-black",
                theme === 'terminal' && "border-green-900 bg-black",
                theme === 'ethereal' && "border-indigo-100 bg-indigo-50/30",
                theme === 'minecraft' && "border-[#1e1e1e] bg-[#1e1e1e]",
                theme === 'undertale' && "border-white/20 bg-black",
                theme === 'god-of-war' && "border-[#8b0000]/30 bg-[#1a1a1a]",
                theme === 'cuphead' && "border-black bg-[#f4e4bc]",
                theme === 'comic' && "border-black bg-white"
              )}>
                <button
                  onClick={() => setReorderGroupIndex(null)}
                  className={cn(
                    "px-5 py-2 text-sm font-medium transition-all shadow-sm active:scale-95",
                    theme === 'modern' && "bg-blue-600 hover:bg-blue-700 text-white rounded-lg",
                    theme === 'professional' && "bg-slate-900 hover:bg-slate-800 text-white rounded-lg",
                    theme === 'cyberpunk' && "bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg",
                    theme === 'vintage' && "bg-[#4a3728] hover:bg-[#4a3728]/90 text-[#f4f1ea] rounded-none",
                    theme === 'terminal' && "bg-green-500 hover:bg-green-400 text-black rounded-lg",
                    theme === 'ethereal' && "bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl",
                    theme === 'prism' && "bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl",
                    theme === 'minecraft' && "bg-[#545454] text-white hover:bg-[#373737] border-b-4 border-[#1e1e1e] rounded-none",
                    theme === 'undertale' && "bg-white text-black hover:bg-white/90 rounded-none",
                    theme === 'god-of-war' && "bg-[#8b0000] hover:bg-[#a00000] text-white rounded-none",
                    theme === 'cuphead' && "bg-black hover:bg-black/90 text-white rounded-none",
                    theme === 'comic' && "bg-black hover:bg-black/90 text-white rounded-none"
                  )}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}

      </AnimatePresence>

      {/* Image Configuration Modal for New Images */}
      {pendingImage && (
        <ImageSettingsModal
          image={pendingImageSettings}
          onClose={() => setPendingImage(null)}
          onUpdate={(updates) => setPendingImageSettings(prev => ({ ...prev, ...updates }))}
          onConfirm={handleConfirmPendingImage}
          confirmLabel="Add to Document"
        />
      )}

      {/* Save Note Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4",
              theme === 'modern' && "bg-slate-900/50",
              theme === 'vintage' && "bg-[#2c241a]/80",
              theme === 'prism' && "bg-slate-900/40",
              theme === 'professional' && "bg-slate-900/70",
              theme === 'cyberpunk' && "bg-black/80",
              theme === 'terminal' && "bg-black/80",
              theme === 'ethereal' && "bg-indigo-900/40",
              theme === 'minecraft' && "bg-black/60",
              theme === 'undertale' && "bg-black/90",
              theme === 'god-of-war' && "bg-black/80",
              theme === 'cuphead' && "bg-black/60",
              theme === 'comic' && "bg-black/60"
            )}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "w-full max-w-md overflow-hidden",
                theme === 'modern' && "bg-white rounded-3xl shadow-2xl",
                theme === 'vintage' && "bg-[#fdfbf7] rounded-none shadow-[15px_15px_0_rgba(0,0,0,0.1)] border-2 border-[#4a3728]",
                theme === 'prism' && "bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40",
                theme === 'professional' && "bg-white rounded-xl shadow-xl border border-slate-200",
                theme === 'cyberpunk' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] border-2 border-cyan-500",
                theme === 'terminal' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.2)] border-2 border-green-500",
                theme === 'ethereal' && "bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100",
                theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-t-[#ffffff] border-l-[#ffffff] border-b-[#555555] border-r-[#555555] shadow-[8px_8px_0_rgba(0,0,0,0.4)]",
                theme === 'undertale' && "bg-black rounded-none border-4 border-white shadow-[0_0_0_4px_black]",
                theme === 'god-of-war' && "bg-[#1a1a1a] rounded-none border-2 border-[#8b0000] shadow-[0_0_50px_rgba(139,0,0,0.3)]",
                theme === 'cuphead' && "bg-[#f4e4bc] rounded-none border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white rounded-none border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]"
              )}
            >
              <div className={cn(
                "p-6 border-b flex justify-between items-center",
                theme === 'modern' && "border-slate-100",
                theme === 'vintage' && "border-[#4a3728] bg-[#f4f1ea]",
                theme === 'prism' && "border-white/20 bg-white/10",
                theme === 'professional' && "border-slate-100 bg-slate-50",
                theme === 'cyberpunk' && "border-cyan-900 bg-black",
                theme === 'terminal' && "border-green-900 bg-black",
                theme === 'ethereal' && "border-indigo-100 bg-indigo-50/30",
                theme === 'minecraft' && "border-[#1e1e1e] bg-[#1e1e1e]",
                theme === 'undertale' && "border-white/20 bg-black",
                theme === 'god-of-war' && "border-[#8b0000]/30 bg-[#1a1a1a]",
                theme === 'cuphead' && "border-black bg-[#f4e4bc]",
                theme === 'comic' && "border-black bg-white"
              )}>
                <h3 className={cn(
                  "text-xl font-bold flex items-center gap-2",
                  theme === 'modern' && "text-slate-800",
                  theme === 'vintage' && "text-[#4a3728] font-serif",
                  theme === 'prism' && "text-slate-800",
                  theme === 'professional' && "text-slate-800",
                  theme === 'cyberpunk' && "text-cyan-400 uppercase tracking-widest",
                  theme === 'terminal' && "text-green-400 font-mono",
                  theme === 'ethereal' && "text-indigo-900",
                  theme === 'minecraft' && "text-white font-mono",
                  theme === 'undertale' && "text-white font-mono",
                  theme === 'god-of-war' && "text-[#e5e5e5] uppercase tracking-[0.2em]",
                  theme === 'cuphead' && "text-black font-black",
                  theme === 'comic' && "text-black font-black italic"
                )}>
                  <Save className="w-5 h-5 text-blue-500" />
                  Save Note
                </h3>
                <button 
                  onClick={() => setIsSaveModalOpen(false)}
                  className={cn(
                    "p-2 transition-colors rounded-full",
                    theme === 'modern' && "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                    theme === 'vintage' && "text-[#4a3728] hover:bg-[#4a3728]/10",
                    theme === 'prism' && "text-slate-400 hover:text-slate-600 hover:bg-white/40",
                    theme === 'professional' && "text-slate-400 hover:text-slate-600 hover:bg-slate-200",
                    theme === 'cyberpunk' && "text-cyan-400 hover:bg-cyan-500/20",
                    theme === 'terminal' && "text-green-400 hover:bg-green-500/20",
                    theme === 'ethereal' && "text-indigo-400 hover:bg-indigo-50",
                    theme === 'minecraft' && "text-white hover:bg-[#545454]",
                    theme === 'undertale' && "text-white hover:bg-white/10",
                    theme === 'god-of-war' && "text-[#e5e5e5] hover:bg-[#8b0000]/20",
                    theme === 'cuphead' && "text-black hover:bg-black/10",
                    theme === 'comic' && "text-black hover:bg-black/10"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={cn(
                "p-6",
                theme === 'modern' && "bg-white",
                theme === 'vintage' && "bg-[#fdfbf7]",
                theme === 'prism' && "bg-white/60",
                theme === 'professional' && "bg-white",
                theme === 'cyberpunk' && "bg-black",
                theme === 'terminal' && "bg-black",
                theme === 'ethereal' && "bg-white/50",
                theme === 'minecraft' && "bg-[#c6c6c6]",
                theme === 'undertale' && "bg-black",
                theme === 'god-of-war' && "bg-[#1a1a1a]",
                theme === 'cuphead' && "bg-[#f4e4bc]",
                theme === 'comic' && "bg-white"
              )}>
                <label className={cn(
                  "block text-sm font-bold mb-2",
                  theme === 'modern' && "text-slate-700",
                  theme === 'vintage' && "text-[#4a3728]",
                  theme === 'prism' && "text-slate-700",
                  theme === 'professional' && "text-slate-700",
                  theme === 'cyberpunk' && "text-cyan-400 uppercase tracking-widest",
                  theme === 'terminal' && "text-green-400 font-mono",
                  theme === 'ethereal' && "text-indigo-900",
                  theme === 'minecraft' && "text-white font-mono",
                  theme === 'undertale' && "text-white font-mono",
                  theme === 'god-of-war' && "text-[#e5e5e5]",
                  theme === 'cuphead' && "text-black font-black",
                  theme === 'comic' && "text-black font-black italic"
                )}>Note Name</label>
                <input
                  type="text"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  placeholder="e.g., Biology Chapter 4"
                  className={cn(
                    "w-full px-4 py-3 outline-none transition-all font-medium",
                    theme === 'modern' && "rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-slate-700",
                    theme === 'professional' && "rounded-lg border border-slate-300 focus:border-slate-800 text-slate-900",
                    theme === 'cyberpunk' && "bg-black border-2 border-cyan-500 text-cyan-400 focus:shadow-[0_0_15px_rgba(0,255,255,0.5)] rounded-none",
                    theme === 'vintage' && "bg-[#f4f1ea] border-2 border-[#4a3728] text-[#4a3728] rounded-none",
                    theme === 'terminal' && "bg-black border-2 border-green-500 text-green-400 focus:shadow-[0_0_15px_rgba(0,255,0,0.5)] font-mono rounded-none",
                    theme === 'ethereal' && "bg-white/80 border-2 border-indigo-100 text-indigo-900 focus:border-indigo-400 rounded-2xl",
                    theme === 'prism' && "bg-white/40 border-2 border-white/60 text-slate-800 focus:border-indigo-400 rounded-2xl",
                    theme === 'minecraft' && "bg-[#1e1e1e] border-4 border-b-[#ffffff] border-r-[#ffffff] border-t-[#555555] border-l-[#555555] text-white font-mono rounded-none",
                    theme === 'undertale' && "bg-black border-2 border-white text-white font-mono rounded-none",
                    theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000] text-white rounded-none",
                    theme === 'cuphead' && "bg-white border-4 border-black text-black font-black rounded-none",
                    theme === 'comic' && "bg-white border-4 border-black text-black font-black rounded-none"
                  )}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNote();
                  }}
                />
              </div>
              <div className={cn(
                "p-6 border-t flex justify-end gap-3",
                theme === 'modern' && "bg-slate-50 border-slate-100",
                theme === 'vintage' && "bg-[#f4f1ea] border-[#4a3728]",
                theme === 'prism' && "bg-white/10 border-white/20",
                theme === 'professional' && "bg-slate-50 border-slate-100",
                theme === 'cyberpunk' && "bg-black border-cyan-900",
                theme === 'terminal' && "bg-black border-green-900",
                theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100",
                theme === 'minecraft' && "bg-[#1e1e1e] border-[#1e1e1e]",
                theme === 'undertale' && "bg-black border-white/20",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-[#8b0000]/30",
                theme === 'cuphead' && "bg-[#f4e4bc] border-black",
                theme === 'comic' && "bg-white border-black"
              )}>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className={cn(
                    "px-6 py-2.5 font-bold transition-colors",
                    theme === 'modern' && "rounded-xl text-slate-600 hover:bg-slate-200",
                    theme === 'professional' && "rounded-lg text-slate-600 hover:bg-slate-200",
                    theme === 'cyberpunk' && "text-cyan-400 hover:text-cyan-300",
                    theme === 'vintage' && "text-[#4a3728] hover:underline",
                    theme === 'terminal' && "text-green-400 hover:text-green-300 font-mono",
                    theme === 'ethereal' && "rounded-xl text-indigo-600 hover:bg-indigo-50",
                    theme === 'prism' && "rounded-xl text-slate-600 hover:bg-white/40",
                    theme === 'minecraft' && "text-white hover:underline font-mono",
                    theme === 'undertale' && "text-white hover:underline font-mono",
                    theme === 'god-of-war' && "text-[#e5e5e5] hover:text-white",
                    theme === 'cuphead' && "text-black hover:underline",
                    theme === 'comic' && "text-black hover:underline"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteName.trim()}
                  className={cn(
                    "px-6 py-2.5 font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
                    theme === 'modern' && "rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-blue-200",
                    theme === 'professional' && "rounded-lg text-white bg-slate-900 hover:bg-slate-800",
                    theme === 'cyberpunk' && "rounded-none text-black bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)]",
                    theme === 'vintage' && "rounded-none text-[#f4f1ea] bg-[#4a3728] hover:bg-[#4a3728]/90",
                    theme === 'terminal' && "rounded-none text-black bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(0,255,0,0.5)] font-mono",
                    theme === 'ethereal' && "rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
                    theme === 'prism' && "rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200",
                    theme === 'minecraft' && "rounded-none text-white bg-[#545454] hover:bg-[#373737] border-b-4 border-[#1e1e1e] font-mono",
                    theme === 'undertale' && "rounded-none text-black bg-white hover:bg-white/90 font-mono",
                    theme === 'god-of-war' && "rounded-none text-white bg-[#8b0000] hover:bg-[#a00000]",
                    theme === 'cuphead' && "rounded-none text-white bg-black hover:bg-black/90",
                    theme === 'comic' && "rounded-none text-white bg-black hover:bg-black/90"
                  )}
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
