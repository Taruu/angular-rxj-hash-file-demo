import {Injectable} from '@angular/core';
import {
  asapScheduler,
  concatWith,
  merge,
  Observable,
  queueScheduler,
  scheduled,
  share,
  skipLast,
  Subject,
  takeLast
} from 'rxjs';
import xxhash from 'xxhash-wasm';

@Injectable({
  providedIn: 'root'
})
export class HashFileService {
  private readonly chunkSize: number = 1.28e+8 //128МБ 1.28e+8
  private harsherWorkerInitializer: any;
  private xxHarsherWorker: any;
  private fileReader: FileReader;
  private currentFile: File;


  //Кормим файл
  public calculateFileHash(file: File): any {
    this.currentFile = file;
    console.log("start file", file)
    //Начинаем хешировать новый файл
    const startTime = new Date();
    this.xxHarsherWorker = this.harsherWorkerInitializer()

    const ResultSubject = new Subject<ResultValue>()


    //Список Blob для чтения
    let listChunks: Blob[] = [];
    const chunkCount = Math.ceil(file.size / this.chunkSize)

    for (let nowChunk = 0; nowChunk < chunkCount; nowChunk++) {
      const start = nowChunk * this.chunkSize;
      const end = start + this.chunkSize;
      if (end > file.size) {
        const end = file.size;
      }
      listChunks.push(file.slice(start, end))
    }

    let listObservableBlob: Observable<FileReadStatus>[] = [];
    let listObservableStatus: Observable<FileReadStatus>[] = [];
    for (const [i, nowBlobChunk] of listChunks.entries()) {
      const ObservableReadBytes = this.readBlob(i, nowBlobChunk)
      listObservableStatus.push(ObservableReadBytes.pipe(skipLast(1)))
      listObservableBlob.push(ObservableReadBytes.pipe(takeLast(1)))

    }


    const statusHashFile = scheduled([], asapScheduler).pipe(
      concatWith(...listObservableStatus),
      concatWith(ResultSubject),
      share())

    const hashFileQueue = scheduled([], queueScheduler).pipe(concatWith(...listObservableBlob))


    //Вычисление хеша файла
    hashFileQueue.subscribe({
      next: (doneBytes) => {
        const arrayUint8 = new Uint8Array(doneBytes as ArrayBuffer)
        this.xxHarsherWorker.update(arrayUint8);
      },
      error: (e) => console.error(e),
      complete: () => {
        //фикс бага статуса
        const nowProgress: ProgressBarStatus = {
          nowSize: this.currentFile.size,
          fileSize: this.currentFile.size,
          filename: this.currentFile.name
        }
        ResultSubject.next(nowProgress as ProgressBarStatus);

        ResultSubject.next({
          fileObj: file,
          fileHash: this.xxHarsherWorker.digest().toString(16),
          timeHash: (new Date().getTime() - startTime.getTime())
        } as FileHashed)
        ResultSubject.complete();
      }
    })


    return merge(ResultSubject, statusHashFile).pipe(share()) // компануем обсервер в котором есть все
  }


  private readBlob(chunkCount: number, chunkBlob: Blob): Observable<FileReadStatus> {
    //read bytes by rxjs

    return new Observable<FileReadStatus>((subscriber) => {
      this.fileReader.onprogress = (event) => {
        const nowProgress: ProgressBarStatus = {
          nowSize: (chunkCount * this.chunkSize) + event.loaded,
          fileSize: this.currentFile.size,
          filename: this.currentFile.name
        }
        //console.log(nowProgress)
        subscriber.next(nowProgress as ProgressBarStatus);
      }


      this.fileReader.readAsArrayBuffer(chunkBlob)
      this.fileReader.onload = () => {
        subscriber.next(this.fileReader.result as ArrayBuffer);
      }
      this.fileReader.onloadend = () => subscriber.complete()
      this.fileReader.onerror = () => subscriber.error()
    }).pipe(share())

  }


  private async initWorker() {
    const {create64} = await xxhash()
    this.harsherWorkerInitializer = create64;
  }

  constructor() {
    //Это точно норм вариант? на rxjs!
    this.initWorker().then();
    this.fileReader = new FileReader(); //при создании сервиса мы создаем риадер

    this.currentFile = new File([], "", {})


  }
}

export interface ProgressBarStatus {
  nowSize: number;
  fileSize: number;
  filename: string;
}

export interface FileHashed {
  fileObj: File;
  fileHash: string,
  timeHash: number
}

type FileReadStatus = ProgressBarStatus | ArrayBuffer;
type ResultValue = ProgressBarStatus | FileHashed;
