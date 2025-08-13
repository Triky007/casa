import os
import uuid
import shutil
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles

# Configuración
UPLOAD_DIR = "uploads/task-photos"
THUMBNAIL_DIR = "uploads/task-photos/thumbnails"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
THUMBNAIL_SIZE = (300, 300)


def ensure_upload_directories():
    """Crear directorios de upload si no existen"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(THUMBNAIL_DIR, exist_ok=True)


def validate_image_file(file: UploadFile) -> None:
    """Validar que el archivo sea una imagen válida"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Verificar extensión
    file_ext = os.path.splitext(file.filename.lower())[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Verificar tipo MIME
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")


def generate_unique_filename(original_filename: str) -> str:
    """Generar nombre único para el archivo"""
    file_ext = os.path.splitext(original_filename.lower())[1]
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{file_ext}"


async def save_uploaded_file(file: UploadFile) -> Tuple[str, str, int]:
    """
    Guardar archivo subido y retornar (filename, web_path, file_size)
    """
    ensure_upload_directories()
    validate_image_file(file)

    # Generar nombre único
    filename = generate_unique_filename(file.filename)
    full_path = os.path.join(UPLOAD_DIR, filename)
    web_path = f"/uploads/task-photos/{filename}"  # Ruta web relativa

    # Guardar archivo
    file_size = 0
    async with aiofiles.open(full_path, 'wb') as f:
        while chunk := await file.read(8192):  # Leer en chunks de 8KB
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                # Eliminar archivo parcial si excede el tamaño
                os.remove(full_path)
                raise HTTPException(status_code=413, detail="File too large")
            await f.write(chunk)

    return filename, web_path, file_size


def create_thumbnail(full_path: str, filename: str) -> Optional[str]:
    """
    Crear thumbnail de la imagen y retornar la ruta web del thumbnail
    """
    try:
        thumbnail_filename = f"thumb_{filename}"
        thumbnail_full_path = os.path.join(THUMBNAIL_DIR, thumbnail_filename)
        thumbnail_web_path = f"/uploads/task-photos/thumbnails/{thumbnail_filename}"

        with Image.open(full_path) as img:
            # Convertir a RGB si es necesario (para PNG con transparencia)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')

            # Crear thumbnail manteniendo proporción
            img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            img.save(thumbnail_full_path, 'JPEG', quality=85, optimize=True)

        return thumbnail_web_path
    except Exception as e:
        print(f"Error creating thumbnail: {e}")
        return None


def delete_file(filepath: str) -> bool:
    """Eliminar archivo del sistema"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {filepath}: {e}")
        return False


def web_path_to_system_path(web_path: str) -> str:
    """Convertir ruta web a ruta del sistema de archivos"""
    if web_path.startswith('/uploads/task-photos/thumbnails/'):
        # Es un thumbnail
        filename = web_path.replace('/uploads/task-photos/thumbnails/', '')
        return os.path.join(THUMBNAIL_DIR, filename)
    elif web_path.startswith('/uploads/task-photos/'):
        # Es una imagen principal
        filename = web_path.replace('/uploads/task-photos/', '')
        return os.path.join(UPLOAD_DIR, filename)
    else:
        # Asumir que ya es una ruta del sistema
        return web_path


def delete_photo_files(file_path: str, thumbnail_path: Optional[str] = None) -> None:
    """Eliminar foto y su thumbnail"""
    # Convertir rutas web a rutas del sistema si es necesario
    system_file_path = web_path_to_system_path(file_path)
    delete_file(system_file_path)

    if thumbnail_path:
        system_thumbnail_path = web_path_to_system_path(thumbnail_path)
        delete_file(system_thumbnail_path)