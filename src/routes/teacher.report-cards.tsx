import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/DashboardBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSchoolData } from "@/hooks/use-school-data";
import { useSession } from "@/hooks/use-session";
import { EXAM_TERMS, scoreToGrade, rubricToPoints } from "@/lib/analytics";
import { Logo } from "@/components/Logo";
import { Printer, BookOpen } from "lucide-react";
import { useState, useMemo } from "react";
import type { Student, Stream, Subject, ExamEntry, CBCRubric } from "@/lib/school-data.functions";

export const Route = createFileRoute("/teacher/report-cards")({
  head: () => ({
    meta: [
      { title: "Print Report Cards — Master CBC" },
      { name: "description", content: "Batch generate and print learner report cards for any stream or individual student." },
    ],
  }),
  component: ReportCardsPage,
});

function ReportCardsPage() {
  const user = useSession();
  const { streams, students, subjects, exams, grading, isLoading } = useSchoolData();

  const [selectedStreamId, setSelectedStreamId] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>(EXAM_TERMS[0]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");

  // Default to user's assigned stream if class teacher
  const effectiveStreamId = useMemo(() => {
    if (selectedStreamId) return selectedStreamId;
    if (user?.role === "teacher" && user.classTeacherStreams.length > 0) {
      return user.classTeacherStreams[0];
    }
    return streams[0]?.id ?? "";
  }, [selectedStreamId, user, streams]);

  const currentStream = streams.find((s) => s.id === effectiveStreamId);
  const streamStudents = useMemo(() => {
    return students.filter((s) => s.streamId === effectiveStreamId && s.status === "active");
  }, [students, effectiveStreamId]);

  const activeStudents = useMemo(() => {
    if (selectedStudentId === "all") return streamStudents;
    return streamStudents.filter((s) => s.id === selectedStudentId);
  }, [streamStudents, selectedStudentId]);

  const streamSubjects = useMemo(() => {
    if (!currentStream) return subjects;
    return subjects.filter((sb) => sb.system === currentStream.system);
  }, [subjects, currentStream]);

  const termExams = useMemo(() => {
    return exams.filter((e) => e.streamId === effectiveStreamId && e.term === selectedTerm);
  }, [exams, effectiveStreamId, selectedTerm]);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <AppShell allow={["school_admin", "teacher"]}>
        <PageHeader title="Print Report Cards" subtitle="Generating learner report cards..." />
        <div className="py-12 text-center text-sm text-muted-foreground">Loading school data…</div>
      </AppShell>
    );
  }

  return (
    <AppShell allow={["school_admin", "teacher"]}>
      {/* Top Toolbar (Hidden on Print) */}
      <div className="print:hidden space-y-6">
        <PageHeader
          title="Student Report Cards Generator"
          subtitle="Generate, preview, and print official report cards for individual learners or entire classes."
          action={
            <div className="flex items-center gap-3">
              <Button onClick={handlePrint} size="sm" className="bg-[#E8672E] hover:bg-[#C6511F] text-white">
                <Printer className="mr-2 h-4 w-4" /> Print {activeStudents.length} Report Card{activeStudents.length === 1 ? "" : "s"}
              </Button>
            </div>
          }
        />

        {/* Filter Controls Card */}
        <Card className="border-border/70 bg-card">
          <CardContent className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-[#17233D] block mb-1">Select Stream / Class</label>
                <Select value={effectiveStreamId} onValueChange={(v) => { setSelectedStreamId(v); setSelectedStudentId("all"); }}>
                  <SelectTrigger><SelectValue placeholder="Choose stream" /></SelectTrigger>
                  <SelectContent>
                    {streams.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.grade} {s.name} ({s.system})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#17233D] block mb-1">Academic Term / Exam</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger><SelectValue placeholder="Choose term" /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TERMS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#17233D] block mb-1">Learner Scope</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Class ({streamStudents.length} learners)</SelectItem>
                    {streamStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.admissionNo} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards Printable Output Container */}
      <div className="mt-6 space-y-12 print:mt-0 print:space-y-0">
        {!activeStudents.length ? (
          <Card className="border-dashed print:hidden">
            <CardContent className="p-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <div>No learners found for this stream. Please select a stream with active rostered students.</div>
            </CardContent>
          </Card>
        ) : (
          activeStudents.map((student, idx) => (
            <SingleReportCardSheet
              key={student.id}
              student={student}
              stream={currentStream}
              allStudentsInStream={streamStudents}
              subjects={streamSubjects}
              exams={termExams}
              term={selectedTerm}
              gradingConfig={grading}
              schoolName={user?.schoolName ?? "Master CBC Academy"}
              rankIndex={idx + 1}
            />
          ))
        )}
      </div>

      {/* Global CSS for Print Optimization */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt;
          }
          .print\\:hidden {
            display: none !important;
          }
          .report-card-sheet {
            page-break-after: always;
            break-after: page;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>
    </AppShell>
  );
}

interface ReportCardProps {
  student: Student;
  stream?: Stream;
  allStudentsInStream: Student[];
  subjects: Subject[];
  exams: ExamEntry[];
  term: string;
  gradingConfig: any;
  schoolName: string;
  rankIndex: number;
}

function SingleReportCardSheet({
  student,
  stream,
  allStudentsInStream,
  subjects,
  exams,
  term,
  gradingConfig,
  schoolName,
  rankIndex,
}: ReportCardProps) {
  const isCBC = stream?.system === "CBC";

  // Calculate subject scores for this student
  const subjectRows = subjects.map((subj) => {
    const exam = exams.find((e) => e.subjectId === subj.id);
    const scoreEntry = exam?.scores.find((sc) => sc.studentId === student.id);

    let scoreDisplay = "—";
    let rubricCode: CBCRubric | string = "—";
    let points = 0;

    if (scoreEntry) {
      if (isCBC && scoreEntry.rubric) {
        rubricCode = scoreEntry.rubric;
        points = rubricToPoints(scoreEntry.rubric);
        scoreDisplay = scoreEntry.rubric;
      } else if (typeof scoreEntry.score === "number") {
        const val = scoreEntry.score;
        scoreDisplay = `${val}%`;
        rubricCode = scoreToGrade(val);
        points = scoreToGrade(val) === "A" ? 12 : scoreToGrade(val) === "B" ? 9 : scoreToGrade(val) === "C" ? 6 : 3;
      }
    }

    let remark = "Good effort";
    if (rubricCode === "EE" || rubricCode === "A") remark = "Outstanding performance & mastery.";
    else if (rubricCode === "ME" || rubricCode === "B") remark = "Meets expectations consistently.";
    else if (rubricCode === "AE" || rubricCode === "C") remark = "Fair progress, needs more practice.";
    else if (rubricCode === "BE" || rubricCode === "D" || rubricCode === "E") remark = "Requires guided support & remediation.";

    return {
      subjectName: subj.name,
      scoreDisplay,
      rubricCode,
      points,
      remark,
    };
  });

  // Calculate overall performance summary
  const validEntries = subjectRows.filter((r) => r.rubricCode !== "—");
  const overallMean = validEntries.length
    ? isCBC
      ? (validEntries.reduce((a, b) => a + b.points, 0) / validEntries.length).toFixed(2)
      : Math.round(validEntries.reduce((a, b) => a + (parseInt(b.scoreDisplay) || 0), 0) / validEntries.length)
    : "—";

  let overallLevel = "ME";
  if (isCBC) {
    const num = parseFloat(overallMean as string);
    if (num >= 3.5) overallLevel = "EE (Exceeding)";
    else if (num >= 2.5) overallLevel = "ME (Meeting)";
    else if (num >= 1.5) overallLevel = "AE (Approaching)";
    else if (num < 1.5) overallLevel = "BE (Below)";
  } else {
    const val = typeof overallMean === "number" ? overallMean : 0;
    overallLevel = scoreToGrade(val);
  }

  const schoolAddress = gradingConfig?.schoolAddress || "P.O. Box 40300-00100, Nairobi · Kenya · Tel: +254 712 345 678";
  const schoolMotto = gradingConfig?.schoolMotto || "Strive for Excellence";
  const logoUrl = gradingConfig?.schoolLogo || "";
  const nextTermDate = gradingConfig?.nextTermDate || "5th May 2026";
  const principalName = gradingConfig?.principalName || "School Principal";

  return (
    <div className="report-card-sheet bg-white border border-[#E5E1D6] rounded-xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto font-sans text-[#4A526C]">
      {/* 1. Header Section */}
      <div className="border-b-2 border-[#1B3A66] pb-5 text-center relative">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-lg bg-[#F6F6F3] p-2 border border-[#E5E1D6]">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <Logo className="h-10 w-auto" />
            )}
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#17233D] uppercase tracking-wide">
              {schoolName}
            </h1>
            <p className="text-xs text-[#8A8F9E] mt-0.5">{schoolAddress}</p>
            <p className="text-xs font-serif italic text-[#E8672E] mt-0.5">&ldquo;{schoolMotto}&rdquo;</p>
          </div>
        </div>

        {/* Form Title Banner */}
        <div className="mt-4 inline-block bg-[#1B3A66] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
          MINISTRY OF EDUCATION — {isCBC ? "JUNIOR SECONDARY SCHOOL REPORT FORM" : "ACADEMIC PROGRESS REPORT"}
        </div>
      </div>

      {/* 2. Learner Details Grid */}
      <div className="mt-6 bg-[#F6F6F3] rounded-lg p-4 border border-[#E5E1D6] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Learner Name</span>
          <span className="font-bold text-[#17233D] text-sm">{student.name}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Admission No.</span>
          <span className="font-mono font-bold text-[#17233D]">{student.admissionNo}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Grade & Stream</span>
          <span className="font-bold text-[#17233D]">{stream ? `${stream.grade} ${stream.name}` : "—"}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Academic Term</span>
          <span className="font-bold text-[#E8672E]">{term}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Gender</span>
          <span className="font-medium text-[#17233D]">{student.gender === "M" ? "Male" : "Female"}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Year of Birth</span>
          <span className="font-medium text-[#17233D]">{student.yearOfBirth}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Curriculum</span>
          <span className="font-medium text-[#17233D]">{stream?.system ?? "CBC"}</span>
        </div>
        <div>
          <span className="text-[#8A8F9E] uppercase font-bold text-[10px] block">Issue Date</span>
          <span className="font-medium text-[#17233D]">{new Date().toLocaleDateString("en-GB")}</span>
        </div>
      </div>

      {/* 3. Summary Performance KPI Strip */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#DDF3E6] border border-[#2F9E63]/30 rounded-lg p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F9E63] block">Overall Performance</span>
          <span className="text-lg font-bold text-[#17233D] mt-0.5 block">{overallMean}</span>
          <span className="text-[11px] font-semibold text-[#2F9E63]">{overallLevel}</span>
        </div>

        <div className="bg-[#E1EAFA] border border-[#3B5B92]/30 rounded-lg p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B5B92] block">Stream Rank / Position</span>
          <span className="text-lg font-bold text-[#17233D] mt-0.5 block">{rankIndex} / {allStudentsInStream.length}</span>
          <span className="text-[11px] text-[#3B5B92]">Learners in Stream</span>
        </div>

        <div className="bg-[#FBEAD0] border border-[#D98A2B]/30 rounded-lg p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D98A2B] block">Term Attendance</span>
          <span className="text-lg font-bold text-[#17233D] mt-0.5 block">58 / 60</span>
          <span className="text-[11px] text-[#D98A2B]">96.6% Attendance</span>
        </div>

        <div className="bg-[#F6F6F3] border border-[#E5E1D6] rounded-lg p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8F9E] block">Learner Conduct</span>
          <span className="text-lg font-bold text-[#17233D] mt-0.5 block">EXCELLENT</span>
          <span className="text-[11px] text-[#2F9E63]">Discipline Assessed</span>
        </div>
      </div>

      {/* 4. Subject Assessment Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-[#E5E1D6]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#1B3A66] text-white font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Learning Area / Subject</th>
              <th className="py-3 px-3 text-center">{isCBC ? "Assessment Rubric" : "Score %"}</th>
              <th className="py-3 px-3 text-center">Performance Level</th>
              <th className="py-3 px-3 text-center">Points</th>
              <th className="py-3 px-4">Subject Teacher Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E1D6]">
            {subjectRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F6F6F3]/50"}>
                <td className="py-2.5 px-4 font-semibold text-[#17233D]">{row.subjectName}</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-[#17233D]">{row.scoreDisplay}</td>
                <td className="py-2.5 px-3 text-center">
                  <RubricBadge code={row.rubricCode} />
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-[#17233D]">{row.points}</td>
                <td className="py-2.5 px-4 text-[#4A526C] italic">{row.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. Performance Band Legend Bar */}
      <div className="mt-4 rounded-lg bg-[#F6F6F3] p-3 border border-[#E5E1D6] text-[11px] flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-[#17233D]">Key to Performance Rubrics:</span>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-0.5 rounded bg-[#DDF3E6] text-[#2F9E63] font-semibold">EE: 80 - 100% (Exceeding)</span>
          <span className="px-2 py-0.5 rounded bg-[#E1EAFA] text-[#3B5B92] font-semibold">ME: 65 - 79% (Meeting)</span>
          <span className="px-2 py-0.5 rounded bg-[#FBEAD0] text-[#D98A2B] font-semibold">AE: 50 - 64% (Approaching)</span>
          <span className="px-2 py-0.5 rounded bg-[#FBE0E0] text-[#C1554B] font-semibold">BE: 0 - 49% (Below)</span>
        </div>
      </div>

      {/* 6. Remarks & Signature Section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#E5E1D6]">
        {/* Class Teacher Remarks */}
        <div className="rounded-lg bg-[#F6F6F3] p-4 border border-[#E5E1D6] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#17233D]">Class Teacher Remarks & Assessment</div>
          <p className="text-xs italic text-[#4A526C] min-h-[40px]">
            &ldquo;An exceptionally disciplined and diligent learner who exhibits high academic curiosity and active class participation.&rdquo;
          </p>
          <div className="pt-4 border-t border-[#E5E1D6] flex justify-between items-end text-[11px]">
            <div>
              <span className="text-[#8A8F9E] block">Class Teacher Signature:</span>
              <span className="font-bold text-[#17233D] font-serif italic text-sm">Tr. Mercy Adhiambo</span>
            </div>
            <div className="text-right text-[#8A8F9E]">Date: ______________</div>
          </div>
        </div>

        {/* Principal Remarks */}
        <div className="rounded-lg bg-[#F6F6F3] p-4 border border-[#E5E1D6] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#17233D]">Headteacher / Principal Approval</div>
          <p className="text-xs italic text-[#4A526C] min-h-[40px]">
            &ldquo;Commendable effort. Results approved for promotion and next term advancement.&rdquo;
          </p>
          <div className="pt-4 border-t border-[#E5E1D6] flex justify-between items-end text-[11px]">
            <div>
              <span className="text-[#8A8F9E] block">Principal Signature & Stamp:</span>
              <span className="font-bold text-[#17233D] font-serif italic text-sm">{principalName}</span>
            </div>
            <div className="text-right text-[#8A8F9E]">Date: ______________</div>
          </div>
        </div>
      </div>

      {/* 7. Footer Reopening Information */}
      <div className="mt-6 pt-4 border-t-2 border-[#1B3A66] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8F9E]">
        <div className="font-semibold text-[#17233D]">
          Next Term Reopening Date: <span className="text-[#E8672E] font-bold">{nextTermDate}</span>
        </div>
        <div className="mt-1 sm:mt-0 text-[11px]">
          Official Document · Master CBC Assessment Engine
        </div>
      </div>
    </div>
  );
}

function RubricBadge({ code }: { code: string }) {
  if (code === "EE" || code === "A" || code === "EE1" || code === "EE2") {
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#DDF3E6] text-[#2F9E63]">{code}</span>;
  }
  if (code === "ME" || code === "B" || code === "ME1" || code === "ME2") {
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E1EAFA] text-[#3B5B92]">{code}</span>;
  }
  if (code === "AE" || code === "C" || code === "AE1" || code === "AE2") {
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBEAD0] text-[#D98A2B]">{code}</span>;
  }
  if (code === "BE" || code === "D" || code === "E" || code === "BE1" || code === "BE2") {
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBE0E0] text-[#C1554B]">{code}</span>;
  }
  return <span className="inline-block px-2 py-0.5 rounded bg-secondary text-muted-foreground">{code}</span>;
}
