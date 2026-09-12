/**
 * Throwaway visual decision board.
 * Question: which UnMute in-call foundations should we lock?
 * Isolated from product nav. Picks persist in the URL.
 */
import { Button } from '@astryxdesign/core/Button';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Icon } from '@astryxdesign/core/Icon';
import { Switch } from '@astryxdesign/core/Switch';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import './-foundations.css';
import {
  DENSITY_OPTIONS,
  ELEVATION_OPTIONS,
  HUE_OPTIONS,
  ROUNDNESS_OPTIONS,
  TONE_OPTIONS,
  TYPE_OPTIONS,
  compactSearch,
  parseFoundationSearch,
  selectedFoundationsJson,
  toggleSearchValue,
  type Density,
  type FoundationSearch,
  type Hue,
  type Tone,
} from './-model';

export const Route = createFileRoute('/_prototype/foundations')({
  validateSearch: (search: Record<string, unknown>) => parseFoundationSearch(search),
  component: FoundationsPickerPage,
});

function FoundationsPickerPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const json = selectedFoundationsJson(search);

  function patchSearch(next: FoundationSearch) {
    void navigate({ search: compactSearch(next), replace: true });
  }

  function copyJson() {
    void navigator.clipboard.writeText(json).then(
      () => toast.success('Foundations JSON copied'),
      () => toast.error('Could not copy'),
    );
  }

  function copyUrl() {
    void navigator.clipboard.writeText(window.location.href).then(
      () => toast.success('URL copied'),
      () => toast.error('Could not copy'),
    );
  }

  return (
    <main className="proto-page">
        <div className="proto-video" aria-hidden="true" />
        <header className="proto-summary">
          <div className="proto-summary-picks">
            <SummaryChip label="Hue" value={search.hue} />
            <SummaryChip label="Tone" value={search.tone} />
            <SummaryChip label="Density" value={search.density} />
            <SummaryChip label="Round" value={search.roundness} />
            <SummaryChip label="Elev" value={search.elevation} />
            <SummaryChip label="Type" value={search.type} />
          </div>
          <div className="proto-actions">
            <Switch
              label="also light sheet?"
              value={search.sheet === 'light'}
              size="sm"
              onChange={(checked) => {
                patchSearch({
                  ...search,
                  sheet: checked ? 'light' : undefined,
                });
              }}
            />
            <Button
              label="Copy JSON"
              size="sm"
              variant="ghost"
              icon={<Icon icon="copy" />}
              onClick={copyJson}
            />
            <Button label="Copy URL" size="sm" variant="ghost" onClick={copyUrl} />
          </div>
        </header>

        <div className="proto-layout">
          <VStack gap={1} align="stretch">
            <Decision title="Brand hue">
              {HUE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  why={option.why}
                  selected={search.hue === option.id}
                  hue={option.id}
                  onSelect={() => patchSearch(toggleSearchValue(search, 'hue', option.id))}
                >
                  <MiniStage>
                    <span className="proto-swatch" data-hue={option.id} />
                    <span className="proto-fake-btn" data-hue={option.id}>
                      Join
                    </span>
                  </MiniStage>
                </OptionCard>
              ))}
            </Decision>

            <Decision title="Neutral tone">
              {TONE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  why={option.why}
                  selected={search.tone === option.id}
                  onSelect={() => patchSearch(toggleSearchValue(search, 'tone', option.id))}
                >
                  <MiniStage>
                    <ToolbarSample tone={option.id} />
                  </MiniStage>
                </OptionCard>
              ))}
            </Decision>

            <Decision title="Density">
              {DENSITY_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  why={option.why}
                  selected={search.density === option.id}
                  onSelect={() =>
                    patchSearch(toggleSearchValue(search, 'density', option.id))
                  }
                >
                  <ControlCluster density={option.id} />
                </OptionCard>
              ))}
            </Decision>

            <Decision title="Roundness">
              {ROUNDNESS_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  why={option.why}
                  selected={search.roundness === option.id}
                  onSelect={() =>
                    patchSearch(toggleSearchValue(search, 'roundness', option.id))
                  }
                >
                  <div className="proto-shape-row" data-roundness={option.id}>
                    <span className="proto-shape-btn" />
                    <span className="proto-shape-tile" />
                    <span className="proto-shape-dialog" />
                  </div>
                </OptionCard>
              ))}
            </Decision>

            <Decision title="Elevation">
              {ELEVATION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  why={option.why}
                  selected={search.elevation === option.id}
                  onSelect={() =>
                    patchSearch(toggleSearchValue(search, 'elevation', option.id))
                  }
                >
                  <div className="proto-elev-stack" data-elevation={option.id}>
                    <span className="proto-elev-card" />
                    <span className="proto-elev-pop" />
                    <span className="proto-elev-modal" />
                  </div>
                </OptionCard>
              ))}
            </Decision>

            <Decision title="Typography personality">
              {TYPE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  label={option.label}
                  why={option.why}
                  selected={search.type === option.id}
                  onSelect={() => patchSearch(toggleSearchValue(search, 'type', option.id))}
                >
                  <div className="proto-type-sample" data-type={option.id}>
                    <span className="proto-type-nav">Stage</span>
                    <span className="proto-type-name">Maya Chen</span>
                    <span className="proto-type-cue">Ask about the Q3 timeline</span>
                  </div>
                </OptionCard>
              ))}
            </Decision>
          </VStack>

          <aside className="proto-aside">
            <Heading level={2}>Composed preview</Heading>
            <Text type="supporting">Uses only the current URL picks.</Text>
            <Text type="supporting">Dark (default)</Text>
            <ComposedPreview search={search} />
            {search.sheet === 'light' ? (
              <>
                <Text type="supporting">Light sheet</Text>
                <ComposedPreview search={search} sheet="light" />
              </>
            ) : null}
            <HStack gap={2} justify="between">
              <Text type="supporting">Selected foundations</Text>
              <Token label={search.sheet === 'light' ? 'light on' : 'dark only'} />
            </HStack>
            <pre className="proto-json">{json}</pre>
          </aside>
        </div>
      </main>
  );
}

function SummaryChip({ label, value }: { label: string; value?: string }) {
  return (
    <span className={value ? 'proto-chip' : 'proto-chip is-empty'}>
      <span className="proto-chip-key">{label}</span>
      <span className="proto-chip-val">{value ?? '—'}</span>
    </span>
  );
}

function Decision({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="proto-section">
      <h2 className="proto-section-title">{title}</h2>
      <div className="proto-options">{children}</div>
    </section>
  );
}

function OptionCard({
  label,
  why,
  selected,
  onSelect,
  children,
  hue,
}: {
  label: string;
  why: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  hue?: Hue;
}) {
  return (
    <button
      type="button"
      className="proto-option"
      aria-pressed={selected}
      data-hue={hue}
      onClick={onSelect}
    >
      <span className="proto-option-label">{label}</span>
      {children}
      <span className="proto-option-why">{why}</span>
    </button>
  );
}

function MiniStage({ children }: { children: ReactNode }) {
  return (
    <div className="proto-mini">
      <div className="proto-video-still" />
      <div className="proto-mini-ui">{children}</div>
    </div>
  );
}

function ToolbarSample({ tone }: { tone: Tone }) {
  return (
    <div className="proto-toolbar" data-tone={tone}>
      <span className="proto-dot-row">
        <span className="proto-dot" />
        <span>Maya Chen</span>
      </span>
      <ControlCluster density="compact" />
    </div>
  );
}

function ControlCluster({ density }: { density: Density }) {
  return (
    <div className="proto-cluster" data-density={density}>
      <span className="proto-ctrl" aria-hidden="true">
        <MicGlyph />
      </span>
      <span className="proto-ctrl" aria-hidden="true">
        <CamGlyph />
      </span>
      <span className="proto-ctrl is-end" aria-hidden="true">
        <EndGlyph />
      </span>
      <span className="proto-ctrl" aria-hidden="true">
        <MoreGlyph />
      </span>
    </div>
  );
}

function ComposedPreview({
  search,
  sheet,
}: {
  search: FoundationSearch;
  sheet?: 'light';
}) {
  const roles = [
    'background',
    'surface',
    'text',
    'muted',
    'border',
    'primary',
    'success',
    'warning',
    'danger',
  ] as const;

  return (
    <div
      className="proto-preview"
      data-hue={search.hue}
      data-tone={search.tone}
      data-density={search.density}
      data-roundness={search.roundness}
      data-elevation={search.elevation}
      data-type={search.type}
      data-sheet={sheet}
    >
      <div className="proto-call">
        <div className="proto-call-stage proto-video-still" />
        <div className="proto-call-chrome">
          <div className="proto-call-top">
            <span className="proto-live">
              <span className="proto-live-dot" />
              LIVE
            </span>
            <div className="proto-tiles">
              <div className="proto-tile">
                <span className="proto-tile-name">Maya Chen</span>
              </div>
              <div className="proto-tile">
                <span className="proto-tile-name">Leo Park</span>
              </div>
            </div>
          </div>
          <div className="proto-call-bottom">
            <p className="proto-cue">Ask about the Q3 timeline</p>
            <div className="proto-controls">
              <span className="proto-call-btn">
                <MicGlyph />
              </span>
              <span className="proto-call-btn">
                <CamGlyph />
              </span>
              <span className="proto-call-btn is-danger">
                <EndGlyph />
              </span>
              <span className="proto-call-btn is-primary">Share</span>
            </div>
          </div>
        </div>
      </div>

      <div className="proto-lab">
        <span className="proto-lab-label">Semantic</span>
        <div className="proto-swatches">
          {roles.map((role) => (
            <div key={role} className="proto-role" data-role={role}>
              <i />
              <span>{role}</span>
            </div>
          ))}
        </div>

        <span className="proto-lab-label">Controls</span>
        <div className="proto-state-row">
          <button type="button" className="proto-state">
            Default
          </button>
          <button type="button" className="proto-state is-hover">
            Hover
          </button>
          <button type="button" className="proto-state is-active">
            Active
          </button>
          <button type="button" className="proto-state is-focus">
            Focus
          </button>
          <button type="button" className="proto-state is-disabled" disabled>
            Disabled
          </button>
          <button type="button" className="proto-state is-loading">
            Loading
          </button>
        </div>

        <span className="proto-lab-label">Type xs–xl</span>
        <div className="proto-type-row">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <span key={size} data-size={size}>
              Ag
            </span>
          ))}
        </div>

        <span className="proto-lab-label">Spacing</span>
        <div className="proto-space-row">
          {(['1', '2', '3', '4', '6', '8'] as const).map((space) => (
            <i key={space} className="proto-tick" data-space={space} />
          ))}
        </div>

        <span className="proto-lab-label">Radii</span>
        <div className="proto-radius-row">
          <i className="proto-radius-box" data-r="control" />
          <i className="proto-radius-box" data-r="card" />
          <i className="proto-radius-box" data-r="modal" />
        </div>

        <span className="proto-lab-label">Heights</span>
        <div className="proto-height-row">
          <i className="proto-height-box" data-h="sm" />
          <i className="proto-height-box" data-h="md" />
          <i className="proto-height-box" data-h="lg" />
        </div>

        <span className="proto-lab-label">Shadows</span>
        <div className="proto-shadow-row">
          <i className="proto-shadow-box" data-s="subtle" />
          <i className="proto-shadow-box" data-s="popover" />
          <i className="proto-shadow-box" data-s="modal" />
        </div>
      </div>
    </div>
  );
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="3" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </svg>
  );
}

function CamGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="M15 10l6-3v10l-6-3z" />
    </svg>
  );
}

function EndGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 15c4-3 8-3 12 0M8 18l-2-4 4 .5M16 18l2-4-4 .5" />
    </svg>
  );
}

function MoreGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}
