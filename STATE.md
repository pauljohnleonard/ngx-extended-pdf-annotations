## State

### AnnotationRecord

- _dirty_ changes not persisted to storage. Any edits set this flag..
- _published_ comment is publicly visible

### Focus

- annotationService.focusComment;
- commentComponent.inputRecord;

# Behaviour

Unpublished comments are auto saved and shared across devices.
Auto loop every few seconds.

```
  if (NOT published) {
      if (dirty) {
          // SAVE COMMENT
          dirty=false
      }
  }
```

Published comments are not auto saved and require explicit button PRESS

```
 if ( press PUBLISH) {
     // SAVE COMMENT
    dirty=false
    published=true
 }
```

# Reply

Same as comments ?
This means you can have unpublished replies. Might need to think about this.

# UX

- Eye / Not Eye icon indicate published comments
- Publish button active if comment is not empty and unpublished OR comment is published and dirty

If item is not focusItem just display commment.
