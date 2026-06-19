---
sync: draft
lastLocalEdit: 2026-06-10T11:48:00+12:00
---

# Backend MessageTemplate System

## How Email Templates Work

Templates are stored in `system\content\MessageTemplate\` as files, registered in `system\content\messagetemplate.xml`.

### Adding a New Template

1. Create folder: `system\content\MessageTemplate\{Template Display Name}\`
2. Add three files:
   - `html.txt` — HTML email body with merge tokens
   - `text.txt` — plaintext fallback
   - `dynamicdatakeys.xml` — lists expected merge token names
3. Add a `<row>` entry in `system\content\messagetemplate.xml`
4. Add 3 `<Content Include>` entries in `system\content\content.csproj` (one per file)

### messagetemplate.xml Row Format

```xml
<row pk="{32-char-hex-guid}">
    <column name="Name" type="varchar" length="50">connector.ImportFileFailed</column>
    <column name="DisplayName" type="varchar" length="50">Connector Import File Failed</column>
    <column name="Subject" type="varchar" length="250">Subject with [MergeToken]</column>
    <column name="From" type="varchar" length="100">no-reply@ubiquity.co.nz</column>
    <column name="Type" type="varchar" length="20">TextTransform</column>
    <column name="IsSystem" type="bit">True</column>
    <column name="Text" type="varchar" length="max" src="MessageTemplate\{Folder Name}\text.txt" />
    <column name="Html" type="varchar" length="max" src="MessageTemplate\{Folder Name}\html.txt" />
    <column name="DynamicDataKeys" type="xml" length="max" src="MessageTemplate\{Folder Name}\dynamicdatakeys.xml" />
</row>
```

### dynamicdatakeys.xml Format

```xml
<DynamicDataKeyProvider>
    <keys>
        <key name="ConnectorName" />
        <key name="FileName" />
    </keys>
</DynamicDataKeyProvider>
```

### Merge Token Syntax

Square brackets: `[TokenName]` — rendered by `ContentTransformParser` using `TextTransform` type.

### How Templates Are Consumed

- gRPC: `System.MessageService.SendMessage` (proto: `ubiquity/system/v1/message_service.proto`)
- Request: `SendMessageRequest(template_name, to_email, to_display_name, data map, from_email, from_display_name)`
- The `data` map keys must match the `DynamicDataKeys` in the template
- Backend renders the template and sends via its SMTP infrastructure (`EmailPump.SendMail`)

### Key Code Locations

- Proto: `ubiquity-protos/protos/ubiquity/system/v1/message_service.proto`
- gRPC impl: `remotingbridge/core/Services/System/MessageServiceImpl.cs`
- Manager: `system/core/Managers/MessageManager.cs` (method: `SendMessage`)
- Template entity: `system/core/Data/MessageTemplate.cs`
- Rendering: `u2ool/esl/ContentTransformParser.cs` via `MessageTemplateInfo.RenderDictionary()`
- Content dir: `system/content/MessageTemplate/`
- Registry: `system/content/messagetemplate.xml`

### DON'T Do This

- Don't add templates via raw SQL migration scripts — use the `system\content\` pattern (Stuart Kennedy confirmed June 2026)
- Don't use curly braces `{token}` — it's square brackets `[token]`
- Don't send emails directly from Connectors-Prefect via SES for templated messages — use `MessageService.SendMessage` gRPC
- Don't forget `content.csproj` — every new file in `system\content\` MUST have a `<Content Include>` entry or the project won't build (Stuart Kennedy caught this June 2026)
- Don't just add the folder + XML row — the full checklist is: folder → 3 files → messagetemplate.xml row → content.csproj entries

### Existing System Templates

- `u3.Welcome`
- `u3.LostPassword`
- `u3.LoginSetup`
- `u3.LoginSetupSSO`
- `u3.ParentUserCreated`
- `connector.ImportFileFailed` (new, PBI #3512676)
