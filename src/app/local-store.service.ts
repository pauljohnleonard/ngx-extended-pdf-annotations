import { Injectable } from '@angular/core';

import {
  AnnotationPayload,
  AnnotationRecord,
  AnnotationStorage,
} from 'projects/ngx-extended-pdf-annotations/src/public-api';
import { Subject } from 'rxjs';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const storageKey = 'AnnotationDBEvent';
@Injectable({
  providedIn: 'root',
})
export class LocalStoreService implements AnnotationStorage {
  db: IDBDatabase;
  clientHash: string;
  update$ = new Subject<AnnotationPayload>();
  constructor() {}

  async initialize() {
    this.clientHash = uuidv4();

    window.addEventListener('storage', (e) => {
      //   console.log(`xxx bankid service`, e);

      if (e.key === storageKey) {
        const payload = JSON.parse(e.newValue);
        // console.log(payload);
        this.update$.next(payload);
      }
    });

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

  updateAnnotation(record: AnnotationRecord) {
    var transaction = this.db.transaction('records', 'readwrite');
    var objectStore = transaction.objectStore('records');
    objectStore.put(record);
    const payload: AnnotationPayload = {
      record,
      type: 'UPDATE',
      clientHash: this.clientHash,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
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
