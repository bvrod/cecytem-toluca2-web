import { FaArrowUpRightFromSquare, FaEnvelope, FaLocationDot, FaPhone } from "react-icons/fa6";
import SectionHeading from "../components/SectionHeading";

export default function MapSection({ contact }) {
  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Ubicación"
        title="Visítanos y conoce el campus donde empieza tu siguiente nivel"
        description="La ubicación del plantel está pensada para conectar a estudiantes, familias y comunidad con una experiencia educativa cercana y tecnológica."
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="glass-card rounded-[2rem] p-7">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="accent-icon mt-1 flex h-12 w-12 items-center justify-center rounded-2xl">
                <FaLocationDot />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Dirección
                </p>
                <p className="mt-2 leading-8 text-[var(--text)]">{contact.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="accent-icon mt-1 flex h-12 w-12 items-center justify-center rounded-2xl">
                <FaPhone />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Teléfono
                </p>
                <p className="mt-2 text-[var(--text)]">{contact.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="accent-icon mt-1 flex h-12 w-12 items-center justify-center rounded-2xl">
                <FaEnvelope />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Correo
                </p>
                <p className="mt-2 text-[var(--text)]">{contact.email}</p>
              </div>
            </div>
          </div>

          <a
            href={contact.mapLink}
            target="_blank"
            rel="noreferrer"
            className="cta-primary mt-8 inline-flex items-center gap-3"
          >
            Abrir en Maps
            <FaArrowUpRightFromSquare />
          </a>
        </div>

        <div className="glass-card overflow-hidden rounded-[2rem] p-3">
          <iframe
            src={contact.mapEmbed}
            title="Ubicación del plantel"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[420px] w-full rounded-[1.5rem] border-0"
          />
        </div>
      </div>
    </div>
  );
}
