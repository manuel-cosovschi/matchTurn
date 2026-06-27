import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de uso — MatchTurn",
  description: "Términos de uso y condiciones de MatchTurn.",
};

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-10">
      <Link href="/" className="text-sm text-emerald-300 underline">
        ← Volver
      </Link>
      <h1 className="mt-4 text-2xl font-black text-white">Términos de uso</h1>
      <p className="mt-1 text-sm text-gray-400">Última actualización: 2026</p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-gray-300">
        <section>
          <h2 className="mb-1 font-bold text-white">1. Titularidad</h2>
          <p>
            MatchTurn (la “App”), incluyendo su código fuente, diseño, interfaz,
            contenido, base de datos, lógica de funcionamiento, nombre y marca,
            es propiedad exclusiva de su titular y está protegida por las leyes
            de propiedad intelectual y de marcas. Todos los derechos reservados.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-bold text-white">2. Uso permitido</h2>
          <p>
            Se permite usar la App únicamente para organizar partidos y
            confirmar asistencia, tal como se ofrece públicamente. No se otorga
            ningún otro derecho ni licencia sobre la App.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-bold text-white">3. Prohibiciones</h2>
          <p>Sin autorización previa y por escrito del titular, queda prohibido:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Copiar, reproducir, distribuir o publicar, total o parcialmente, el
              código, el diseño o el contenido de la App.
            </li>
            <li>Modificar, adaptar o crear obras derivadas de la App.</li>
            <li>
              Realizar ingeniería inversa, descompilar o desensamblar la App,
              salvo en la medida que la ley lo permita expresamente.
            </li>
            <li>
              Utilizar el nombre “MatchTurn”, su logo o identidad visual, o
              cualquier signo confusamente similar.
            </li>
            <li>
              Extraer datos de forma automatizada (scraping/crawling) o acceder a
              la API por fuera de la aplicación oficial.
            </li>
            <li>Comercializar, sublicenciar o alquilar la App o sus partes.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-bold text-white">4. Datos y privacidad</h2>
          <p>
            La App almacena los datos mínimos para funcionar (cuenta del
            organizador y nombres de confirmación de cada fecha). No vendemos tus
            datos. Los nombres que se cargan en un link son visibles para quienes
            tengan ese link.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-bold text-white">5. Sin garantías</h2>
          <p>
            La App se ofrece “tal cual”, sin garantías de ningún tipo. El titular
            no será responsable por daños derivados del uso o la imposibilidad de
            uso de la App.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-bold text-white">6. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de la República Argentina.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-bold text-white">7. Contacto</h2>
          <p>
            Para permisos, licencias o consultas:{" "}
            <a
              href="mailto:manucosovschi@gmail.com"
              className="text-emerald-300 underline"
            >
              manucosovschi@gmail.com
            </a>
          </p>
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        © 2026 MatchTurn. Todos los derechos reservados.
      </p>
    </main>
  );
}
