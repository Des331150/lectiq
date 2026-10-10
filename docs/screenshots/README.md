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

These are point-in-time evidence, not current-state documentation. If a fix
lands, the screenshot goes stale — regenerate rather than trusting them.