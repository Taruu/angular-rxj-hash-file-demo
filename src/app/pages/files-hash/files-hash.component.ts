import {Component, OnInit} from '@angular/core';
import {
  asapScheduler,
  asyncScheduler, concatMap, concatWith,
  debounceTime, exhaustMap,
  publish, queueScheduler,
  sampleTime,
  scheduled,
  skipLast, switchMap,
  takeLast,
  throttleTime
} from 'rxjs';
import {FileHashed, HashFileService, ProgressBarStatus} from 'src/app/shared/services/hash-file.service';


@Component({
  selector: 'app-files-hash',
  templateUrl: './files-hash.component.html',
  styleUrls: ['./files-hash.component.scss']
})

export class FilesHashComponent implements OnInit {
  public value: any[] = [];
  public listHashedFiles: FileHashed[] = [];
  public nowHashedFile: ProgressBarStatus = {nowSize: 0, fileSize: 0, filename: ""};
  public blockButtons: boolean = false;

  constructor(private hashFileService: HashFileService) {
    this.hashFileService = new HashFileService();
  }

  public formatLoading = (value: number): string => {
    return `Loaded ${this.SizeBytesToHum(this.nowHashedFile.fileSize * value)}/${this.SizeBytesToHum(this.nowHashedFile.fileSize)}`
  }

  SizeBytesToHum(fileSize: number): string {
    let str_size = ""
    if (fileSize > 1073741824) {
      str_size = `${(fileSize / 1073741824).toFixed(2)} GB`
    } else if (fileSize > 1048576) {
      str_size = `${(fileSize / 1048576).toFixed(2)} MB`
    } else {
      str_size = `${(fileSize / 1024).toFixed(2)} KB`
    }
    return str_size
  }

  newFilesValues(event: any): void {
    console.log(this.value);
    this.lookupFiles().then()
  }

  private async lookupFiles(): Promise<void> {
    this.listHashedFiles = []
    this.blockButtons = true
    //console.log("block buttons", this.blockButtons)

    const result = scheduled(this.value, queueScheduler).pipe(
      concatMap(file => {
        const fileObserver = this.hashFileService.calculateFileHash(file)
        fileObserver.pipe(takeLast(1)).subscribe({
          next: (fileHash: FileHashed) => {
            this.listHashedFiles.push(fileHash)
            //console.log("end", v)
          }
        })
        fileObserver.pipe(skipLast(1), throttleTime(100, undefined, {trailing: true})).subscribe({
          next: (statusReadFile: ProgressBarStatus) => {
            this.nowHashedFile = statusReadFile
          }
        })
        return fileObserver
      })
    );
    result.subscribe({
      complete: () =>{
        this.blockButtons = false;
      }
    })
    console.log()
    for (let file of this.value) {
      // const fileObserver = this.hashFileService.calculateFileHash(x)
      // fileObserver.pipe(takeLast(1)).subscribe({
      //   next: (v: any) => {
      //     this.listHashedFiles.push(v)
      //     console.log("end", v)
      //   }
      // })
      // fileObserver.pipe(skipLast(1), throttleTime(1, undefined, {trailing: true}), publish()).subscribe({
      //   next: (v: any) => {
      //     this.nowHashedFile = v
      //   }
      // })


      //console.log(result)


    }
  }

  ngOnInit(): void {

  }

}
