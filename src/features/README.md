# Feature module structure

Feature folders own their page-level workflows and domain-specific UI. Keep the structure consistent, but do not create empty folders just to make every feature look identical.

## Folder responsibilities

- `pages/`: route-level pages. A page composes the feature UI, owns route-level loading/error state, and coordinates actions.
- `components/`: meaningful feature-specific UI blocks extracted from pages. Examples include filters, tables, forms, detail panels, and modals. Components should receive the data and callbacks they need through props and should not duplicate page orchestration.
- `services/`: API requests and feature service adapters. Keep endpoint details and request/response handling here.
- `types/`: feature-specific domain and API types.
- `hooks/`: reusable feature state/behavior that is not presentation-specific.
- `utils/`: pure feature-specific helpers.

## When to create a components folder

Create `components/` when a feature has one or more substantial UI blocks that benefit from being isolated, reused, tested, or maintained independently. Do not create an empty folder, and do not extract every short JSX fragment or one-use wrapper. A component is a good extraction candidate when it has a clear responsibility, meaningful markup/state, or is used in multiple places within the feature.

Keep small, simple page-only markup in the page. As a page grows, extract cohesive sections such as filters, tables, forms, and detail modals so the page remains an orchestrator rather than a large collection of unrelated UI and event handlers.

## Shared versus feature-specific UI

- Reusable UI used by multiple features belongs in `src/components/` or `src/design-system/` when it is a visual primitive.
- UI used only by one feature belongs in that feature's `components/`.
- Domain logic and API contracts remain in the feature that owns them. Do not move business rules into generic design-system components.

## Existing exceptions

Auth context/provider and storage modules remain at the auth feature root because they are feature entry points and shared auth infrastructure, not page components. Small features may legitimately contain only `pages/`, `services/`, and `types/` until a substantial feature component is needed.
