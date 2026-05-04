import PageHero from '../components/PageHero';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

const Classroom = () => {
  return (
    <div className="relative z-0 min-h-screen bg-blue-50">
      <PageHero
        kicker="Online Classroom"
        title="Teach with a modern smartboard"
        description="Responsive layout first. Next we plug in a whiteboard engine with pen, shapes, sticky notes, images, undo/redo, and export."
        primaryAction={{ label: 'Start Board', href: '#board' }}
        secondaryAction={{ label: 'Open Resources', to: '/resources' }}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full">
          <main id="board" className="rounded-3xl border border-blue-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-blue-100 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-blue-900">Smartboard</div>
                <div className="text-sm text-blue-700">Live board</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                  Share
                </button>
                <button type="button" className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors">
                  Save
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-3xl border border-blue-100 overflow-hidden bg-white h-[520px] lg:h-[680px]">
                <Tldraw inferDarkMode={false} autoFocus={false} />
              </div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
};

export default Classroom;
