class Clip{
   //因为要保存到vue实例中，所以直接传一个$vm当闭包使用了
   constructor(wpId, $vm, Orientation){
      // 裁剪后图片的尺寸
      this.imgWidth = 600;
      this.imgHeight = 600;
      
      this.regional = document.getElementById(wpId);
      $('canvas').remove();
      this.getImage = document.createElement('canvas');
      this.getImage.id = 'image-box';
      this.editBox = document.createElement('canvas');
      this.editBox.id = 'cover-box';

      this.regional.appendChild(this.getImage);
      this.regional.appendChild(this.editBox);
      this.$vm = $vm;
      this.Orientation = Orientation;
      this.clipImgW = 600;
      this.clipImgH = 600;
   }
   init(file){
      this.sx = 0; //裁剪框的初始x
      this.sy = 0; //裁剪框的初始y
      this.sWidth = 600; //裁剪框的宽
      this.sHeight = 600; //裁剪框的高 
      this.chooseBoxScale = this.sWidth / this.sHeight;

      this.handleFiles(file);
   }
   handleFiles(file){
      let t = this;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function() {
         t.imgUrl = this.result;
         t.paintImg(this.result);
      }
   }
   paintImg(picUrl){
      let t = this;
      let cxt = t.getImage.getContext('2d');
      
      //先清空画布
      cxt.clearRect(0, 0, this.getImage.width, this.getImage.height);

      let img = new Image();
      img.src = picUrl;

      img.onload = function() {
         let vertSquashRatio = t.detectVerticalSquash(img);
         
         if(t.Orientation === 6 || t.Orientation === 8){
            let imgScale =  img.height / img.width;
            let boxScale = t.regional.offsetWidth / t.regional.offsetHeight;
            //判断盒子与图片的比列
            if (imgScale > boxScale) {
               //设置图片的像素
               t.imgHeight = t.regional.offsetWidth / imgScale;
               t.imgWidth = t.regional.offsetWidth;
            } else {
               //设置图片的像素
               t.imgHeight = t.regional.offsetHeight;
               t.imgWidth = t.regional.offsetHeight * imgScale;
            }
            //判断图片与选择框的比例大小，作出裁剪
            if (imgScale > t.chooseBoxScale) {
               //设置选择框的像素
               t.sWidth = t.imgHeight;
               t.sHeight = t.imgHeight * t.chooseBoxScale;
               //设置初始框的位置
               t.sy = 0;
               t.sx = (t.imgWidth - t.sHeight) / 2;
            } else {
               //设置选择框的像素
               t.sWidth = t.imgWidth;
               t.sHeight = t.imgWidth / t.chooseBoxScale;

               t.sy = (t.imgHeight - t.imgWidth) / 2;
               t.sx = 0;
            }
            t.getImage.width = 2 * t.imgWidth;
            t.getImage.height = 2 * t.imgHeight;
            
            t.getImage.style.height = t.imgHeight + 'px';
            t.getImage.style.width = t.imgWidth + 'px';
            if(t.Orientation === 6){
               cxt.rotate(Math.PI / 2);
               cxt.translate(0,0);
               cxt.drawImage(img, 0, 0, 2 * t.imgHeight * vertSquashRatio, -2 * t.imgWidth * vertSquashRatio);
            } else {
               cxt.rotate(-Math.PI / 2);
               cxt.translate(0,0);
               cxt.drawImage(img, 0, 0, -2 * t.imgHeight * vertSquashRatio, 2 * t.imgWidth * vertSquashRatio);
            }
            
            cxt.restore();//恢复状态

         } else {
             
            let imgScale = img.width / img.height;
            let boxScale = t.regional.offsetWidth / t.regional.offsetHeight;

            //判断盒子与图片的比列
            if (imgScale < boxScale) {
               //设置图片的像素
               t.imgWidth = t.regional.offsetHeight * imgScale;
               t.imgHeight = t.regional.offsetHeight;
            } else {
               //设置图片的像素
               t.imgWidth = t.regional.offsetWidth;
               t.imgHeight = t.regional.offsetWidth / imgScale;
            }

            //判断图片与选择框的比例大小，作出裁剪
            if (imgScale < t.chooseBoxScale) {
                  //设置选择框的像素
                  t.sWidth = t.imgWidth;
                  t.sHeight = t.imgWidth / t.chooseBoxScale;

                  //设置初始框的位置
                  t.sx = 0;
                  t.sy = (t.imgHeight - t.sHeight) / 2;
            } else {
                  //设置选择框的像素
                  t.sWidth = t.imgHeight * t.chooseBoxScale;
                  t.sHeight = t.imgHeight;

                  t.sx = (t.imgWidth - t.sWidth) / 2;
                  t.sy = 0;
            }
            //高分屏下图片模糊，需要2倍处理
            t.getImage.height = 2 * t.imgHeight;
            t.getImage.width = 2 * t.imgWidth;
            
            t.getImage.style.width = t.imgWidth + 'px';
            t.getImage.style.height = t.imgHeight + 'px';
            if(t.Orientation === 3) {
               cxt.rotate(Math.PI);
               cxt.translate(0,0);
               cxt.drawImage(img, 0, 0, -2 * t.imgWidth * vertSquashRatio, -2 * t.imgHeight * vertSquashRatio);
               cxt.restore();//恢复状态
            }else {
               cxt.drawImage(img, 0, 0, 2 * t.imgWidth * vertSquashRatio, 2 * t.imgHeight * vertSquashRatio);
            }
         }
         t.cutImage();
         t.drag();
      }       
   }
   cutImage(){
      let t = this;

      //绘制遮罩层：
      t.editBox.height =2 * t.imgHeight;
      t.editBox.width =2 * t.imgWidth;

      t.editBox.style.display = 'block';
      t.editBox.style.width = t.imgWidth + 'px';
      t.editBox.style.height = t.imgHeight + 'px';

      let cover = t.editBox.getContext("2d");
      cover.fillStyle = "rgba(0, 0, 0, 0.7)";

      cover.fillRect(0, 0, 2 * t.imgWidth, 2 * t.imgHeight);
      cover.clearRect(2 *t.sx, 2 * t.sy, 2 * t.sWidth, 2 * t.sHeight);
   }
   drag(){
      let t = this;
      let draging = false;

      //记录初始点击的pageX，pageY。用于记录位移
      let pageX = 0;
      let pageY = 0;

      //初始位移
      let startX = 0;
      let startY = 0;


      t.editBox.addEventListener('touchmove', function(ev) {
         let e = ev.touches[0];

         let offsetX = e.pageX - pageX;
         let offsetY = e.pageY - pageY;
         if (draging) {
               if (t.imgHeight == t.sHeight) {

                  t.sx = startX + offsetX;

                  if (t.sx <= 0) {
                     t.sx = 0;
                  } else if (t.sx >= t.imgWidth - t.sWidth) {
                     t.sx = t.imgWidth - t.sWidth;
                  }
               } else {
                  t.sy = startY + offsetY;

                  if (t.sy <= 0) {
                     t.sy = 0;
                  } else if (t.sy >= t.imgHeight - t.sHeight) {
                     t.sy = t.imgHeight - t.sHeight;
                  }
               }
               t.cutImage();
         }
      });
      t.editBox.addEventListener('touchstart', function(ev) {
         let e = ev.touches[0];
         draging = true;

         pageX = e.pageX;
         pageY = e.pageY;

         startX = t.sx;
         startY = t.sy;

      })
      t.editBox.addEventListener('touchend', function() {
         draging = false;
      })
   }
   save(){
      let t = this;
      let cropWidthScale, cropHeightScale;
      let sx, sy;
      let imgWidth = t.getImage.width / 2;
      let imgHeight = t.getImage.height / 2;
      let b = t.sx || t.sy;
      let rotate = t.Orientation;

      let a, clipW;
      console.log(imgWidth>imgHeight)
      if(imgWidth > imgHeight){
         a = 600 * imgWidth / imgHeight;
         clipW = a*b/imgWidth;
      } else {
         a = 600 * imgHeight / imgWidth;
         clipW = a*b/imgHeight;
      }
      // if(t.Orientation === 3 || t.Orientation === 6){
      //    clipW = a - 600 - clipW;
      // }
      if(rotate === 3 || (imgWidth>imgHeight && rotate === 6) || (imgHeight > imgWidth && rotate === 8)){
         clipW = a - 600 - clipW;
      }


      return Math.floor(clipW);
   }
   //用于修复ios下的canvas截图问题
   //详情可以看这里http://stackoverflow.com/questions/11929099/html5-canvas-drawimage-ratio-bug-ios
   detectVerticalSquash(img) {
      if(/png$/i.test(img.src)) {
         return 1;
      }
      let iw = img.naturalWidth, ih = img.naturalHeight;
      let canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = ih;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      let data = ctx.getImageData(0, 0, 1, ih).data;
      
      let sy = 0;
      let ey = ih;
      let py = ih;
      while (py > sy) {
         const alpha = data[(py - 1) * 4 + 3];
         if (alpha === 0) {
               ey = py;
         } else {
               sy = py;
         }
         py = (ey + sy) >> 1;
      }
      const ratio = (py / ih);
      return (ratio===0)?1:ratio;
   }
}

// export default Clip;