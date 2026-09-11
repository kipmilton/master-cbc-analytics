import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { submitSchoolApplication } from "@/lib/tenants.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Register your school — Master CBC" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [systemSelect, setSystemSelect] = useState<string>("");
  const [agree, setAgree] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);

    if (!systemSelect) return toast.error("Please select a curriculum system");
    if (!agree) return toast.error("Please agree to the Terms of Service and Privacy Policy");

    // Junior and Senior CBC map to 'cbc' system
    const system = systemSelect === "844" ? "844" : systemSelect === "both" ? "both" : "cbc";

    setBusy(true);
    try {
      const email = String(fd.get("email") ?? "").trim().toLowerCase();
      const password = String(fd.get("pw") ?? "");
      const schoolName = String(fd.get("sname") ?? "").trim();
      const county = String(fd.get("county") ?? "").trim();
      const phone = String(fd.get("phone") ?? "").trim();
      const principalName = String(fd.get("pname") ?? "").trim();

      if (!email || !password || !schoolName || !county || !phone || !principalName) {
        return toast.error("Please fill in all required fields.");
      }

      // 1. Create the account and store the application server-side (bypasses RLS safely)
      await submitSchoolApplication({
        data: {
          email,
          password,
          schoolName,
          county,
          phone,
          system,
          principalName,
          principalTitle: "Principal",
        },
      });

      // 2. Sign the applicant in so they land straight on their status page
      const { supabase } = await import("@/lib/supabase");
      const { data: sData } = await supabase.auth.signInWithPassword({ email, password });

      toast.success("School application submitted! Your account is under review.");

      if (typeof window !== "undefined") window.dispatchEvent(new Event("mastercbc:auth"));

      if (sData?.session) {
        navigate({ to: "/pending-approval" });
      } else {
        toast.info("Application submitted! Please sign in with your email and password.");
        navigate({ to: "/login" });
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      const message =
        err?.message ||
        (typeof err === "string" ? err : "Could not submit your application. Please check your information and try again.");
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#F6F6F3]">
      {/* LEFT: FORM */}
      <div className="flex flex-col p-6 sm:p-10 lg:p-14 justify-between">
        <div>
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo className="h-7 w-auto" />
            </Link>
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C6511F] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <div className="mt-8 max-w-md">
            <div className="text-[11.5px] font-mono tracking-wider text-[#8A8F9E] uppercase mb-2">
              APPLICATION — REF 000-PENDING
            </div>
            <h1 className="font-serif text-3xl font-semibold text-[#17233D] sm:text-4xl">
              Register your school
            </h1>
            <p className="mt-2 text-sm text-[#4A526C]">
              Submit your details and we&apos;ll call to confirm within 24 hours.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              {/* Fieldset: School */}
              <div>
                <div className="text-[11px] font-bold tracking-wider text-[#8A8F9E] uppercase pb-2 border-b border-[#DCD8CB]">
                  School
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="sname" className="text-xs font-semibold text-[#17233D]">
                      School name
                    </Label>
                    <Input
                      id="sname"
                      name="sname"
                      required
                      placeholder="e.g. Lakeside Secondary School"
                      className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 bg-transparent focus-visible:ring-0 focus-visible:border-[#E8672E] text-sm text-[#17233D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="county" className="text-xs font-semibold text-[#17233D]">
                        County
                      </Label>
                      <Input
                        id="county"
                        name="county"
                        required
                        placeholder="e.g. Kiambu"
                        className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 bg-transparent focus-visible:ring-0 focus-visible:border-[#E8672E] text-sm text-[#17233D]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#17233D]">System</Label>
                      <Select value={systemSelect} onValueChange={setSystemSelect} required>
                        <SelectTrigger className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 bg-transparent focus:ring-0 text-sm text-[#17233D]">
                          <SelectValue placeholder="Select system" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cbc_junior">CBC — Junior Secondary</SelectItem>
                          <SelectItem value="cbc_senior">CBC — Senior Secondary</SelectItem>
                          <SelectItem value="844">8-4-4 — Form 3–4</SelectItem>
                          <SelectItem value="both">Both CBC and 8-4-4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fieldset: Principal */}
              <div>
                <div className="text-[11px] font-bold tracking-wider text-[#8A8F9E] uppercase pb-2 border-b border-[#DCD8CB]">
                  Principal
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="pname" className="text-xs font-semibold text-[#17233D]">
                      Full name
                    </Label>
                    <Input
                      id="pname"
                      name="pname"
                      required
                      placeholder="e.g. Wycliffe Onyango"
                      className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 bg-transparent focus-visible:ring-0 focus-visible:border-[#E8672E] text-sm text-[#17233D]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-[#17233D]">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="principal@school.ac.ke"
                      className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 bg-transparent focus-visible:ring-0 focus-visible:border-[#E8672E] text-sm text-[#17233D]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold text-[#17233D]">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="07xx xxx xxx"
                      className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 bg-transparent focus-visible:ring-0 focus-visible:border-[#E8672E] text-sm text-[#17233D]"
                    />
                  </div>
                </div>
              </div>

              {/* Fieldset: Account */}
              <div>
                <div className="text-[11px] font-bold tracking-wider text-[#8A8F9E] uppercase pb-2 border-b border-[#DCD8CB]">
                  Account
                </div>
                <div className="mt-4">
                  <Label htmlFor="pw" className="text-xs font-semibold text-[#17233D]">
                    Choose a password
                  </Label>
                  <div className="relative">
                    <Input
                      id="pw"
                      name="pw"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      placeholder="At least 8 characters"
                      className="border-0 border-b border-[#DCD8CB] rounded-none px-0 py-2 pr-8 bg-transparent focus-visible:ring-0 focus-visible:border-[#E8672E] text-sm text-[#17233D]"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-1 text-[#8A8F9E] hover:text-[#17233D] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <Checkbox
                  id="agree"
                  checked={agree}
                  onCheckedChange={(checked) => setAgree(checked === true)}
                  required
                />
                <Label htmlFor="agree" className="text-xs text-[#4A526C] leading-normal font-normal cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="text-[#C6511F] font-semibold hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank" className="text-[#C6511F] font-semibold hover:underline">
                    Privacy Policy
                  </Link>. No card required to apply.
                </Label>
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-[#17233D] hover:bg-[#20335A] text-white font-semibold py-3.5 rounded-md text-sm transition-colors"
              >
                {busy ? "Submitting…" : "Submit application"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-[#8A8F9E]">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#C6511F] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-xs text-[#8A8F9E]">© Master CBC</div>
      </div>

      {/* RIGHT: TIMELINE PANEL */}
      <div className="bg-[#16243F] p-8 sm:p-12 lg:p-16 text-white flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md border border-white/14 bg-white/8 px-3 py-1.5 text-xs font-bold text-white">
            Master<span className="text-[#E8672E]">CBC</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white mt-12 leading-snug max-w-sm">
            Live in under a week — here&apos;s exactly how.
          </h2>


          <div className="relative mt-12 pl-7 space-y-8 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-white/16">
            <div className="relative before:absolute before:-left-[28px] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-[#E8672E] before:bg-[#16243F]">
              <div className="text-[11.5px] font-bold tracking-wider text-[#E8672E]">DAY 0</div>
              <h4 className="mt-1 text-sm font-semibold text-white">You apply</h4>
              <p className="mt-0.5 text-xs sm:text-sm text-[#9FAAC2]">
                Takes under 3 minutes. No card, no commitment.
              </p>
            </div>

            <div className="relative before:absolute before:-left-[28px] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-[#E8672E] before:bg-[#16243F]">
              <div className="text-[11.5px] font-bold tracking-wider text-[#E8672E]">DAY 1</div>
              <h4 className="mt-1 text-sm font-semibold text-white">Confirmation call</h4>
              <p className="mt-0.5 text-xs sm:text-sm text-[#9FAAC2]">
                We verify your school and set your admin structure with you directly.
              </p>
            </div>

            <div className="relative before:absolute before:-left-[28px] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-[#E8672E] before:bg-[#16243F]">
              <div className="text-[11.5px] font-bold tracking-wider text-[#E8672E]">DAY 2–4</div>
              <h4 className="mt-1 text-sm font-semibold text-white">Data migration</h4>
              <p className="mt-0.5 text-xs sm:text-sm text-[#9FAAC2]">
                We move your existing class lists and mark sheets in for you — free.
              </p>
            </div>

            <div className="relative before:absolute before:-left-[28px] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-[#E8672E] before:bg-[#16243F]">
              <div className="text-[11.5px] font-bold tracking-wider text-[#E8672E]">DAY 5–7</div>
              <h4 className="mt-1 text-sm font-semibold text-white">Teacher training</h4>
              <p className="mt-0.5 text-xs sm:text-sm text-[#9FAAC2]">
                A short session with your teachers, then you&apos;re grading in the system.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-xs text-[#9FAAC2]">
          Built for Kenyan Junior &amp; Senior Secondary and 8-4-4 Schools.
        </div>
      </div>
    </div>
  );
}
