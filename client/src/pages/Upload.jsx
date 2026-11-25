import UploadForm from "../components/UploadForm";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { usePageTitle } from "../lib/usePageTitle";

const STEPS = [
  ["upload", "Upload", "Your PDF is stored privately and securely."],
  ["files", "Read", "Text is extracted. Scans and old Hindi fonts are read with AI."],
  ["spark", "Summarize", "You get a summary, key points, citations and hearing dates."],
];

export default function Upload() {
  usePageTitle("Upload judgment");
  return (
    <>
      <PageHeader
        eyebrow="New judgment"
        title="Upload a judgment"
        subtitle="Add a PDF of the judgment. We read its text so it can be summarized and searched."
      />
      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card reveal p-5 sm:p-8" style={{ "--d": 1 }}>
          <UploadForm />
        </div>

        <aside className="reveal" style={{ "--d": 2 }}>
          <h2 className="font-serif text-xl">What happens next</h2>
          <ol className="mt-4 space-y-5">
            {STEPS.map(([icon, head, text], i) => (
              <li key={head} className="flex gap-3">
                <span className="stat-icon shrink-0">
                  <Icon name={icon} size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {i + 1}. {head}
                  </p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
