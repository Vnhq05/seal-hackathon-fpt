"use client";

import { useEffect } from "react";
import { useEventWizardStore } from "@/features/admin/store/event-wizard.store";
import { StepIndicator } from "./step-indicator";
import { Step1Name } from "./step-1-name";
import { Step2Info } from "./step-2-info";
import { Step3Timeline } from "./step-3-timeline";
import { Step4Rules } from "./step-4-rules";
import { Step5Prizes } from "./step-5-prizes";
import { Step6Scoring } from "./step-6-scoring";
import { Step7Preview } from "./step-7-preview";

export function EventWizardPage() {
  const { step, setStep, reset } = useEventWizardStore();

  useEffect(() => {
    return () => { reset(); };
  }, [reset]);

  const goNext = () => setStep(Math.min(step + 1, 7));
  const goBack = () => setStep(Math.max(step - 1, 1));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px" }}>
          Create Hackathon Event
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          Fill in the details step by step to create a new hackathon event.
        </p>
      </div>

      <StepIndicator current={step} />

      <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", borderRadius: 12, padding: 32 }}>
        {step === 1 && <Step1Name onNext={goNext} />}
        {step === 2 && <Step2Info onNext={goNext} onBack={goBack} />}
        {step === 3 && <Step3Timeline onNext={goNext} onBack={goBack} />}
        {step === 4 && <Step4Rules onNext={goNext} onBack={goBack} />}
        {step === 5 && <Step5Prizes onNext={goNext} onBack={goBack} />}
        {step === 6 && <Step6Scoring onNext={goNext} onBack={goBack} />}
        {step === 7 && <Step7Preview onBack={goBack} />}
      </div>
    </div>
  );
}
