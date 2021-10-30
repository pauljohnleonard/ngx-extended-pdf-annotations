import { Injectable } from '@angular/core';

import {
  AnnotationRecord,
  AnnotationStorage,
} from 'projects/ngx-extended-pdf-annotations/src/public-api';

@Injectable({
  providedIn: 'root',
})
export class LocalStoreService implements AnnotationStorage {
  db: IDBDatabase;
  store: IDBObjectStore;

  constructor() {
    const request = indexedDB.open('DB');

    request.onupgradeneeded = () => {
      this.db = request.result;
      this.store = this.db.createObjectStore('annotation', { keyPath: 'id' });
    };

    request.onsuccess = () => {
      this.db = request.result;
    };
  }

  saveAnnotation(anno: AnnotationRecord) {
    var transaction = this.db.transaction(['annotation'], 'readwrite');
    var objectStore = transaction.objectStore('annotation');
    objectStore.put(anno);
  }

  updateAnnotation(anno: AnnotationRecord) {
    var transaction = this.db.transaction(['annotation'], 'readwrite');
    var objectStore = transaction.objectStore('annotation');
    objectStore.put(anno);
  }

  deleteAnnotation(anno) {}
}
