// System Architecture — visual pipeline diagram.
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import {
  Database, ScanSearch, UserSearch, Stethoscope, BrainCircuit,
  GitCompareArrows, Bot, ShieldCheck, Wrench, ClipboardCheck,
  BarChart3, GraduationCap, ArrowDown, ArrowRight,
  Cpu, MessageSquare, Shield, Gauge,
} from 'lucide-react';

const PIPELINE: { icon: typeof Database; label: string; tag: string; tagColor: string }[] = [
  { icon: Database, label: 'Revenue Sources', tag: 'Data', tagColor: 'bg-gray-100 text-gray-600' },
  { icon: ScanSearch, label: 'Revenue Risk Detection', tag: 'Deterministic', tagColor: 'bg-blue-50 text-blue-700' },
  { icon: UserSearch, label: 'Customer Context Engine', tag: 'Data', tagColor: 'bg-gray-100 text-gray-600' },
  { icon: Stethoscope, label: 'Failure Diagnosis', tag: 'LLM', tagColor: 'bg-purple-50 text-purple-700' },
  { icon: BrainCircuit, label: 'ML Recovery Probability', tag: 'ML / Prediction', tagColor: 'bg-accent-50 text-accent-700' },
  { icon: GitCompareArrows, label: 'Counterfactual Recovery Engine', tag: 'LLM + ML', tagColor: 'bg-primary-50 text-primary-700' },
  { icon: Bot, label: 'AI Recovery Agent', tag: 'LLM / Reasoning', tagColor: 'bg-purple-50 text-purple-700' },
  { icon: ShieldCheck, label: 'Policy / Guardrail Engine', tag: 'Deterministic Rules', tagColor: 'bg-blue-50 text-blue-700' },
  { icon: Wrench, label: 'Recovery Tools', tag: 'Execution', tagColor: 'bg-success-50 text-success-700' },
  { icon: ClipboardCheck, label: 'Outcome Evaluator', tag: 'Deterministic', tagColor: 'bg-blue-50 text-blue-700' },
  { icon: BarChart3, label: 'Audit + Analytics', tag: 'Data', tagColor: 'bg-gray-100 text-gray-600' },
  { icon: GraduationCap, label: 'Learning / Calibration', tag: 'ML', tagColor: 'bg-accent-50 text-accent-700' },
];

const LAYER_LEGEND = [
  { icon: Cpu, label: 'ML / Prediction', color: 'text-accent-600' },
  { icon: MessageSquare, label: 'LLM / Reasoning', color: 'text-purple-600' },
  { icon: Shield, label: 'Deterministic Rules', color: 'text-blue-600' },
  { icon: Gauge, label: 'Execution Tools', color: 'text-success-600' },
];

export function SystemArchitecture() {
  return (
    <div>
      <PageHeader title="System Architecture" description="RecoverAI pipeline and guardrails" />

      {/* Product statement */}
      <div className="card p-5 mb-6 bg-gradient-to-br from-primary-50/50 to-accent-50/30 border-primary-100">
        <p className="text-center text-base font-semibold text-gray-800 italic">
          "Don't just recover revenue. Choose the recovery action with the highest expected safe return."
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {LAYER_LEGEND.map((l) => {
          const Icon = l.icon;
          return (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
              <Icon className={`w-4 h-4 ${l.color}`} style={{ width: 16, height: 16 }} />
              <span>{l.label}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline diagram */}
        <SectionCard title="RecoverAI Pipeline" description="Detect → Diagnose → Simulate → Decide → Validate → Execute → Recover → Learn" className="lg:col-span-2">
          <div className="flex flex-col items-center gap-1 py-2">
            {PIPELINE.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={stage.label} className="flex flex-col items-center w-full">
                  <div className="flex items-center gap-3 w-full max-w-md p-3 rounded-xl bg-white border border-gray-200 shadow-card hover:shadow-card-hover transition-all animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ width: 20, height: 20 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium ${stage.tagColor}`}>{stage.tag}</span>
                  </div>
                  {idx < PIPELINE.length - 1 && (
                    <ArrowDown className="w-4 h-4 text-gray-300 my-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Traditional vs RecoverAI */}
        <SectionCard title="Traditional Recovery" description="Fixed rule → retry">
          <div className="flex items-center justify-center gap-4 py-6">
            <PipelineNode icon={ScanSearch} label="Detect" />
            <ArrowRight className="w-5 h-5 text-gray-300" />
            <PipelineNode icon={Shield} label="Fixed Rule" />
            <ArrowRight className="w-5 h-5 text-gray-300" />
            <PipelineNode icon={Wrench} label="Execute" />
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            Payment failed → Retry payment. No context, no alternatives, no learning.
          </p>
        </SectionCard>

        <SectionCard title="RecoverAI" description="Counterfactual evaluation → optimal safe action" className="ring-2 ring-accent-200">
          <div className="flex flex-wrap items-center justify-center gap-1.5 py-4">
            {['Detect', 'Diagnose', 'Generate', 'Evaluate', 'Select', 'Validate', 'Execute', 'Measure', 'Learn'].map((label, idx) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1.5 rounded-md bg-accent-50 text-accent-700 text-xs font-medium border border-accent-100">
                  {label}
                </span>
                {idx < 8 && <ArrowRight className="w-3 h-3 text-accent-300" />}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            Why? What are the options? Which has the highest expected recovery? Is it safe? Did it work?
          </p>
        </SectionCard>

        {/* Future AI/ML Architecture */}
        <SectionCard title="Future AI / ML Architecture" description="Interfaces are already prepared for backend integration" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FutureCard icon={BrainCircuit} name="RiskEngine" desc="Scores revenue-at-risk cases" />
            <FutureCard icon={BrainCircuit} name="RecoveryProbabilityModel" desc="Estimates recovery likelihood per action" />
            <FutureCard icon={GitCompareArrows} name="CounterfactualEngine" desc="Evaluates all candidate actions" />
            <FutureCard icon={ShieldCheck} name="PolicyEngine" desc="Validates guardrails before execution" />
            <FutureCard icon={Bot} name="AgentService" desc="Orchestrates the recovery workflow" />
            <FutureCard icon={Wrench} name="RecoveryToolExecutor" desc="Executes the selected action" />
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            All engines are currently deterministic frontend implementations. Each exposes a clean interface that can be swapped for a backend API, ML model, or LLM call without changing the UI.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}

function PipelineNode({ icon: Icon, label }: { icon: typeof ScanSearch; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
        <Icon className="w-6 h-6" style={{ width: 24, height: 24 }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
  );
}

function FutureCard({ icon: Icon, name, desc }: { icon: typeof BrainCircuit; name: string; desc: string }) {
  return (
    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-primary-500" style={{ width: 16, height: 16 }} />
        <span className="font-mono text-xs font-semibold text-gray-800">{name}</span>
      </div>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}
