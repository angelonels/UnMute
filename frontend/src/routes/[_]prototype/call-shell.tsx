/**
 * Locked in-call shell prototype.
 * Gallery until a tile is pinned; spotlight while `speaker` is in the URL.
 */
import { createFileRoute } from '@tanstack/react-router';
import { CallShellPage } from './-call-shell';
import {
  compactCallShellSearch,
  parseCallShellSearch,
  resolveCallShellSearch,
} from './-call-search';

export const Route = createFileRoute('/_prototype/call-shell')({
  validateSearch: (search: Record<string, unknown>) => parseCallShellSearch(search),
  component: CallShellRoute,
});

function CallShellRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const resolved = resolveCallShellSearch(search);

  return (
    <CallShellPage
      search={resolved}
      onSearch={(patch) => {
        void navigate({
          search: compactCallShellSearch({
            ...resolved,
            ...patch,
            speaker:
              patch.speaker === undefined ? resolved.speaker : patch.speaker,
          }),
          replace: true,
        });
      }}
    />
  );
}
