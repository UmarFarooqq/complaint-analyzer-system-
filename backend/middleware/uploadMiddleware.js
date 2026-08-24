const multer=require('multer');const path=require('path');
const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,'backend/uploads/'),filename:(req,file,cb)=>cb(null,Date.now()+'-'+Math.round(Math.random()*1e9)+path.extname(file.originalname))});
const allowed=['image/jpeg','image/png','image/jpg','application/pdf','audio/mpeg','audio/wav','video/mp4'];
const upload=multer({storage,limits:{fileSize:20*1024*1024},fileFilter:(req,file,cb)=>allowed.includes(file.mimetype)?cb(null,true):cb(new Error('Only JPG, PNG, PDF, MP3, WAV and MP4 files are allowed'))});
function handleUploadError(err,req,res,next){if(err)return res.status(400).json({success:false,message:err.message||'File upload failed'});next()}
module.exports={upload,handleUploadError};
