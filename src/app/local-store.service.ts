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

  constructor() {}

  async initialize() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('AnnotationDB');

      request.onupgradeneeded = () => {
        this.db = request.result;
        const store = this.db.createObjectStore('records', {
          keyPath: 'id',
        });
        store.createIndex('documentId', 'documentId', { unique: false });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
    });
  }

  deleteDataBase() {
    indexedDB.deleteDatabase('AnnotationDB');
  }

  saveAnnotation(record: AnnotationRecord) {
    var transaction = this.db.transaction('records', 'readwrite');
    var objectStore = transaction.objectStore('records');
    objectStore.put(record);
  }

  updateAnnotation(record: AnnotationRecord) {
    var transaction = this.db.transaction('records', 'readwrite');
    var objectStore = transaction.objectStore('records');
    objectStore.put(record);
  }

  async fetchDocument(
    documentId: string,
    userId: string
  ): Promise<AnnotationRecord[]> {
    return new Promise((resolve) => {
      var tx = this.db.transaction('records', 'readonly');
      var store = tx.objectStore('records');

      let docIndex = store.index('documentId');
      const request = docIndex.getAll(documentId);

      request.onsuccess = (res) => {
        let records: AnnotationRecord[] = request.result;
        records = records.filter(
          (record) =>
            !record.deleted && (record.shared || record.userId === userId)
        );

        resolve(records);
      };
    });
  }

  deleteAnnotation(anno) {}
}
