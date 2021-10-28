import { Injectable } from '@angular/core';

import { AnnotationRecord } from 'projects/ngx-extended-pdf-annotations/src/public-api';

@Injectable({
  providedIn: 'root',
})
export class LocalStoreService {
  db: IDBDatabase;
  store: IDBObjectStore;

  constructor() {
    const request = indexedDB.open('annotations');

    request.onupgradeneeded = () => {
      // The database did not previously exist, so create object stores and indexes.
      this.db = request.result;
      this.store = this.db.createObjectStore('annotation', { keyPath: 'isbn' });
      const titleIndex = this.store.createIndex('by_id', 'id', {
        unique: true,
      });
      const authorIndex = this.store.createIndex('by_user', 'userId');

      // Populate with initial data.
      // store.put({ title: 'Quarry Memories', author: 'Fred', isbn: 123456 });
      // store.put({ title: 'Water Buffaloes', author: 'Fred', isbn: 234567 });
      // store.put({ title: 'Bedrock Nights', author: 'Barney', isbn: 345678 });
    };

    request.onsuccess = () => {
      this.db = request.result;
    };
  }

  addAnnotation(anno: AnnotationRecord) {
    this.store.put(anno);
  }

  updateAnnotation(anno) {}

  deleteAnnotation(anno) {}
}
