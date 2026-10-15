import { Icon } from '@/components/Icon';
import type { Guide } from '@/lib/admin-guides';

/** Cuadro de ayuda plegable: qué es esta sección y cómo usarla. */
export function GuideBox({ guide, title = '¿Cómo funciona esta sección?', open = true }: { guide: Guide; title?: string; open?: boolean }) {
  return (
    <details className="adm-guide" open={open}>
      <summary>
        <span className="adm-guide__icon"><Icon name="star" size={15} /></span>
        {title}
      </summary>
      <div className="adm-guide__body">
        <p>{guide.what}</p>
        {guide.steps.length > 0 && (
          <ol>
            {guide.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
        {guide.where && <p className="adm-guide__where">Se ve en el sitio en: <strong>{guide.where}</strong></p>}
      </div>
    </details>
  );
}
