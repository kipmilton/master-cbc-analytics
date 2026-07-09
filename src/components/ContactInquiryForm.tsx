import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ContactInquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    school: "",
    purpose: "",
    message: "",
  });

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    window.setTimeout(() => {
      setSubmitting(false);
      toast.success("Thank you! Our team will contact you shortly.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        school: "",
        purpose: "",
        message: "",
      });
    }, 700);
  }

  return (
    <Card className="border-border/70">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold">Request a school demo</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Schools can enquire about onboarding, schedule a walkthrough, or ask about joining Master CBC.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" required placeholder="Jane Wanjiru" value={formData.fullName} onChange={(event) => handleChange("fullName", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" required placeholder="principal@school.co.ke" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" required placeholder="+254 7XX XXX XXX" value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">School Name</Label>
              <Input id="school" required placeholder="Mt. Kenya Academy" value={formData.school} onChange={(event) => handleChange("school", event.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>How can we help?</Label>
            <Select value={formData.purpose} onValueChange={(value) => handleChange("purpose", value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your inquiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="join">I want to join Master CBC</SelectItem>
                <SelectItem value="demo">Book a product demo</SelectItem>
                <SelectItem value="general">General inquiry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={4} required placeholder="Tell us about your school, current reporting process, and what you’d like to improve." value={formData.message} onChange={(event) => handleChange("message", event.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send Inquiry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
