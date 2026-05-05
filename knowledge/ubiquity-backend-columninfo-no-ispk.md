---
sync: draft
notionPageId:
lastLocalEdit:
lastPublished:
---

# ColumnInfo — No IsPK Property in MVC Layer

`ColumnInfo` (`list/common/Info/Schema/ColumnInfo.cs`) inherits from `BaseDataColumn` which has no `IsPK` property.

All `IsPK` references in MVC controllers are commented out.

Key field status is only tracked at the DTE layer (`ListSchema.IsPK` method).

**Impact:** Any feature needing key field detection in the MVC layer will need a schema model update — `IsPK` does not exist on the model that controllers use.
