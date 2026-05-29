import { useState } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'
import type { Animal, BreedConfig } from '../types'

// TODO(future): implement the USMARC 2024 AB-EPD (Across-Breed EPD) adjustment
// factors to enable cross-breed comparisons for the 18 breeds covered in the
// USMARC table. This would replace the hard block with a proper adjusted
// comparison.

interface Props {
  animalA: Animal
  animalB: Animal
  breedA: BreedConfig
  breedB: BreedConfig
  onDismiss?: () => void
}

export default function EvaluationSystemWarning({
  animalA,
  animalB,
  breedA,
  breedB,
  onDismiss
}: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex gap-3">
      <AlertTriangle className="text-amber-600 shrink-0" size={22} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-amber-900">
            Incompatible Evaluation Systems
          </h3>
          {onDismiss && (
            <button onClick={onDismiss} className="text-amber-700 hover:text-amber-900">
              <X size={16} />
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-amber-900 leading-relaxed">
          You are comparing animals evaluated under different systems.
          <br />
          <strong>{animalA.name}</strong> uses{' '}
          <strong>{breedA.evaluationSystem}</strong> from {breedA.association}.
          <br />
          <strong>{animalB.name}</strong> uses{' '}
          <strong>{breedB.evaluationSystem}</strong> from {breedB.association}.
          <br />
          These values cannot be directly averaged or compared — they use
          different base populations, different trait measurement standards, and
          in some cases different units. Breeding predictions across systems are
          disabled. To compare these animals, you would need their Across-Breed
          EPD (AB-EPD) adjustments from the USMARC 2024 table, which this app
          does not currently calculate automatically.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:text-amber-700"
        >
          <Info size={14} /> Learn More
        </button>
      </div>

      {showModal && (
        <LearnMoreModal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function LearnMoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-ranch-950/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <h3 className="text-lg font-semibold">
            EPDs, WBVs & Across-Breed Comparisons
          </h3>
          <button onClick={onClose} className="text-ranch-500 hover:text-ranch-800">
            <X size={18} />
          </button>
        </div>
        <div className="card-body space-y-4 text-sm text-ranch-800">
          <section>
            <h4 className="font-semibold text-ranch-900">EPD — Expected Progeny Difference</h4>
            <p>
              The US standard. Used by the American Wagyu Association (AWA),
              Angus, Hereford, Akaushi, Simmental, Red Angus, Limousin,
              Brahman, and Beefmaster. Measured as the difference a sire's
              progeny is expected to show from breed average for a given trait.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-ranch-900">WBV — Wagyu Breeding Value</h4>
            <p>
              Introduced by the Australian Wagyu Association in February 2026,
              replacing the legacy BREEDPLAN EBV system. WBVs use different base
              populations and often different units (kg vs lbs, cm² vs sq in)
              from US EPDs.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-ranch-900">Why they aren't directly comparable</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Different base populations (breed averages differ).</li>
              <li>Different units of measurement.</li>
              <li>Different measurement standards (e.g. AUS-MEAT vs USDA marbling).</li>
              <li>Different models and trait definitions (e.g. AWA-AU RBY was retired Feb 2026).</li>
            </ul>
          </section>

          <section>
            <h4 className="font-semibold text-ranch-900">Across-Breed EPDs (AB-EPDs)</h4>
            <p>
              The USDA-ARS USMARC publishes an annual Across-Breed EPD adjustment
              table (most recent: 2024) that allows approximate comparison of
              bulls from 18 different breeds on a common basis. CattleGen does
              not currently apply these adjustments automatically, but plans to
              in a future version.
            </p>
            <p>
              Reference:{' '}
              <button
                className="text-ranch-700 underline hover:text-ranch-900"
                onClick={() =>
                  window.cattlegen.shell.openExternal('https://www.ars.usda.gov')
                }
              >
                USDA-ARS
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
