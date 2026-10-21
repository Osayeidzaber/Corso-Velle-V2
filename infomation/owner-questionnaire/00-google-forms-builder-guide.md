# Google Forms setup and administration

This guide is for the person creating the forms. The five numbered form documents contain owner-facing questions. Each question includes a suggested Google Forms type, required/optional status, choices where useful, and explanatory text to paste into its description.

## Recommended structure

Create five separate forms and send them as one clearly ordered discovery package. This preserves the depth of the 270-question bank while allowing the owner to answer in stages. Do not require all five to be completed in one sitting. Pilot the forms before promising a completion time; the amount of detail and asset gathering will vary considerably.

| Order | File | Content questions |
|---|---|---:|
| 1 | [Business, brand, and customers](01-business-brand-and-customers.md) | 50 |
| 2 | [Visual direction and content](02-visual-direction-and-content.md) | 54 |
| 3 | [Shopping experience](03-shopping-experience.md) | 70 |
| 4 | [Operations and integrations](04-catalog-operations-and-integrations.md) | 60 |
| 5 | [Priorities and approval](05-priorities-budget-and-approval.md) | 36 |
| | Total | 270 |

If one form is strongly preferred, use the same five groups as major sections and preserve the internal subsections. Be aware that native routing chooses the next section, not arbitrary individual questions. Separate forms remain easier to review and return to.

## Question notation

- **R:** suggested required. Paragraph answers such as Not sure—recommend or Pending are acceptable unless the prompt explicitly needs a concrete identity.
- **O:** optional. Keep specialist follow-ups optional rather than requiring irrelevant answers.
- **Short answer:** a name, URL, range, or short fact.
- **Paragraph:** explanation, examples, ordered priorities, or a group of related details.
- **Multiple choice:** choose one; suitable for routing where configured.
- **Checkboxes:** choose several; not an ordered ranking.
- **Multiple-choice grid:** choose one preference per row. Keep the rows few and the labels readable on phones.
- **Date:** a known target date. Make it optional when the owner is undecided.

Required here means useful for discovery, not that the owner must have already solved the design problem. The form descriptions explicitly permit uncertainty. Review the suggested flags for this particular owner; do not make every question required by default.

## How to build each form

1. Paste the form title and owner-facing description.
2. Create sections matching the headings in that form file.
3. Use the stable question IDs in titles, for example S37. Should a shopper explicitly choose a size before adding clothing?
4. Put the Help text in the question description; omit the administrative Type/R/O notation from the visible title.
5. Choose the listed field type and paste the supplied choices. Keep choices in their logical order.
6. Enable Other where listed. For preference questions, retain Recommend/Not sure so the owner is not forced to invent certainty.
7. Apply any useful maximum-selection rule to questions asking for up to two/three/five choices. Keep the same instruction in the help text.
8. For grids, use one answer per row. Do not require each column to be used only once: several features can legitimately be Launch essential or Later.
9. Keep question order stable and disable question shuffling. IDs and narrative order matter for review.
10. Preview the form on a phone before sending it. Replace awkward grids with individual multiple-choice fields if necessary.

If you split grid rows into separate questions, use child IDs such as L04a–L04f. The bank has 270 entries before these optional layout changes.

## Branching that actually fits Google Forms

Google's native Go to section based on answer is available for **Multiple choice and Dropdown**, not checkbox selections or paragraph answers. [Official branching guidance](https://support.google.com/docs/answer/141062)

The supplied bank only needs one optional routing setup:

```text
Form 4 opening section: O01 — Existing website?
  Yes, Shopify -------------------+
  Yes, another platform ----------+--> Migration: O02–O08
  Existing, decision pending -----+       |
                                         v
  No, new website ------------------> Catalog: O09–O19
                                         |
                                         v
                              Remaining operations sections
                                         |
                                         v
                                       Submit
```

Configure all three existing-site answers to the migration section and No to catalog. At the end of migration explicitly continue to catalog. Put O01 alone in the routing section so it is clear when the jump occurs. If routing is inconvenient, show migration to everyone, make O02/O03/O05/O07 optional, and add New stores may skip this section to its description.

Do not attempt to show a block for every selected feature in S57 through checkbox branching. Its follow-ups are optional and clearly say when relevant. More elaborate branching would make the form harder to maintain without improving the brief.

## Suggested introduction when sharing the package

> These forms will help us design the store around your brand, customers, and actual business process. Please answer with examples wherever possible. You do not need to know design or Shopify terminology, and Not sure—recommend is a useful answer. Complete the forms in order when convenient; they do not need to be finished in one sitting. If an answer changes, tell us the question ID. Share draft assets as drafts so we know what still needs approval.

## Suggested confirmation message

> Thank you. We will review your answers, identify any decisions or missing content, and turn them into a proposed design and launch scope. Your preferences are recorded; technical support, costs, and launch requirements will be confirmed after review. If you need to correct an answer, use the edit-response option if available or send us the question ID and updated answer.

## Response identity and permissions

For this single owner's project, the form names and a consistent project label in the response sheets are enough to keep submissions together. If several businesses will use the same forms, add a common required Project/brand ID field at the start of every form. That is an administrative field beyond the 270 content questions.

Collect a business email only if needed for response coordination. Choose sign-in/response restrictions based on the intended owner, and test from the owner's likely access conditions. Do not automatically enable organizational restrictions that prevent an outside owner from opening the forms.

Prefer shared-folder links for assets in this package. Ask the owner to grant access only to the project participants who need it. Do not ask them to make private business files public. An inaccessible link becomes a follow-up item, not a reason to change its sharing without approval.

Do not add password, payment-card, private key, verification-code, customer export, or order-record upload fields. Store/admin access is arranged separately using the appropriate collaborator/invitation flow.

## Saving, revising, and completing in stages

Allow response editing if it fits your coordination process. Explain that drafts and submitted responses are different: a submission is what the project team can review.

Do not promise that an anonymous respondent can always resume an unfinished form. Google's documented draft-saving behavior depends on signing into a Google account and whether saving is enabled. Test the setup, then explain the actual behavior to the owner. [Official draft-saving guidance](https://support.google.com/docs/answer/10952360)

Separate forms reduce dependence on that behavior. Keep the final links and titles together in the sharing message. If you share follow-up forms after reviewing the first answers, preserve the original IDs so later discussion remains clear.

## Choices that need careful handling

| Pattern | Setup/review rule |
|---|---|
| None / Not applicable in checkboxes | Tell the owner to select it alone; check contradictions during review |
| Choose up to N | Use a maximum-selection rule where available; retain readable instructions |
| Rank priorities | Use the supplied ordered paragraph prompts, not checkboxes |
| Feature preference | Keep Recommend and Later options; do not treat Want as an approved launch commitment |
| Known target date | Optional Date field; firmness/dependencies are asked separately |
| Budget | Ask currency and a range; Need an estimate is valid |
| Reference URL | Ask which element, device, action, and why; a bare link is incomplete |
| Policy/claim | Record whether it is approved, proposed, or needs verification |
| New business | Permit Not decided and avoid requiring current-store numbers |

## Before sending: preview checklist

- All five forms have matching project naming and an understandable order.
- Every question ID is unique across the package.
- Choices and Other/Recommend options are preserved.
- Required fields can be answered honestly by a new or uncertain business owner.
- O01 routing reaches migration/catalog correctly, including its pending-decision choice.
- Grids are usable on a phone and allow the same column for several rows.
- Links open; reference URLs and shared-folder instructions are clear.
- No sign-in or organization restriction accidentally blocks the intended respondent.
- The form does not reveal other respondents' answers or business information.
- The confirmation/editing behavior matches what you tell the owner.
- A test response has been reviewed to confirm the response sheet is understandable.

## How to review answers

Use [the response review template](06-response-review-template.md). Do not simply copy every requested feature into the launch scope. Extract the customer need, business rule, content requirement, and priority; reconcile contradictions; then recommend a concrete direction with costs/dependencies where relevant.

Current Google Forms behavior was checked against the official help pages linked above on 21 October 2026. Recheck if the creation interface behaves differently when you build the forms.
