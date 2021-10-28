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
      // The database did not previously exist, so create object stores and indexes.
      this.db = request.result;
      this.store = this.db.createObjectStore('annotation', { keyPath: 'id' });
      // const idIndex = this.store.createIndex('by_id', 'id', {
      //   unique: true,
      // });
      // const userIdIndex = this.store.createIndex('by_user', 'userId');

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
    var transaction = this.db.transaction(['annotation'], 'readwrite');
    var objectStore = transaction.objectStore('annotation');
    objectStore.put(anno);
  }

  updateAnnotation(anno: AnnotationRecord) {}

  deleteAnnotation(anno) {}
}
