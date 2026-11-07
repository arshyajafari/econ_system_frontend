# Econ System Design System

This directory contains presentation primitives and semantic visual tokens shared by feature modules.

## Principles

- Reuse semantic tokens for brand, neutral, success, warning, danger and informational states.
- Keep business rules, API calls, permission checks, validation and navigation inside their existing feature modules.
- Standardize visual primitives without forcing different workflows into one generic page or data model.
- Preserve RTL behavior; numeric identifiers, amounts and dates may require explicit LTR treatment.
- Prefer incremental adoption. Do not replace feature-specific controls until their behavior and accessibility have been checked.

## Button

Import `Button` from `src/design-system/components/Button`. It supports semantic variants, sizes, loading and disabled states. Its default type is `button` to prevent accidental form submission; submit actions must explicitly pass `type="submit"`.

The component is intentionally behavior-agnostic. Callers retain ownership of click handlers, permissions, confirmation flows and business logic.
