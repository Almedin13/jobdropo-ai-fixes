import { useState } from "react";
import Step1 from "../../components/auftrag-erstellen/Step1";
import Step2 from "../../components/auftrag-erstellen/Step2";

export default function AuftragErstellen() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    branche: "",
    unterberuf: "",
    datumDurchfuehrung: "",
    festesDatum: "",
    turnus: "",
    turnusDetails: "",
    branchenspezifischeDetails: "",
    bilder: null,
    festpreis: "",
    preisVorschlagen: false,
  });

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className="p-4 max-w-xl mx-auto">
      {step === 1 && (
        <Step1 formData={formData} setFormData={setFormData} onNext={nextStep} />
      )}
      {step === 2 && (
        <Step2
          formData={formData}
          setFormData={setFormData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
    </div>
  );
}
