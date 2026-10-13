# Screenshots

Reference captures taken while reworking the quiz, creation and upload
screens. Each one records a defect that typecheck, lint and build all passed
and that only a rendered page exposed.

| File | What it shows |
|---|---|
| `creation-desktop.png` | Quiz creation at 1280px: the native format select reading "Multiple choice" rather than the stored `mcq` enum, and the label/checkbox rows aligned on one line. |
| `creation-mobile.png` | The same screen at 375px, stacked. Keyboard hints correctly hidden, buttons full width. |
| `creation-overcap-zoom.png` | Topics past the selection ceiling, greyed and disabled. Note this state is unreachable in practice: extraction caps a document at 60 topics, below the server's 100 limit. |
| `upload-too-large.png` | A rejected 45MB PDF naming the file, its real size and the limit. Previously the drop zone silently ate the file with no message at all. |
| `upload-wrong-type.png` | A rejected `.docx`. Previously relabelled `pdf` and stored with a `.pdf` extension, failing later inside the PDF extractor. |

| `auth-wrong-password.png` | A rejected sign-in reporting "That email and password don't match an account." Previously the provider's own message was shown verbatim, and the wording lookup missed the machine code so it often degraded to a generic "Something went wrong". |
| `auth-confirm-email.png` | The post-signup "Check your inbox" screen. Replaces a `?registered=true` redirect that no page read, so someone who had just signed up landed on a bare sign-in form with no explanation. |
| `auth-error-expired.png` | An expired confirmation link explaining what happened. Both auth callback routes redirect to `?error=…` codes that the login page previously ignored. |
| `auth-register-desktop.png` | Sign-up. A duplicate address now reports neutrally instead of confirming the account exists, with a route to sign in. |
| `auth-login-mobile.png` | Sign-in at 375px, with the password reveal toggle. |

| `landing-fixed-desktop-fold.png` | The landing page after the mechanical pass. Hero copy replaced the repeated "active recall" claims with what the product does, the footer no longer links to 404s, and buttons are not nested inside anchors. |
| `landing-fixed-mobile-full.png` | The same page at 375px, full length. |

These are point-in-time evidence, not current-state documentation. If a fix
lands, the screenshot goes stale — regenerate rather than trusting them.