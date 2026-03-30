from gradio_client import Client
from PIL import Image
import os
from datetime import datetime

# Connect to the Space
print("Connecting to Z-Image-Turbo...")
client = Client("https://mrfakename-z-image-turbo.hf.space")

def generate_and_save(prompt: str, height: int = 1024, width: int = 1024, 
                     steps: int = 9, seed: int = 42, randomize: bool = False):
    """
    Generate image from prompt and save it locally.
    """
    print(f"Generating image for prompt: {prompt[:80]}...")

    try:
        result = client.predict(
            prompt=prompt,
            height=height,
            width=width,
            num_inference_steps=steps,
            seed=seed,
            randomize_seed=randomize,
            api_name="/generate_image"   # This matches the function name in the original app.py
        )

        # result.data usually returns: [image, seed_used]
        image_output = result.data[0]   # This is typically a PIL Image or temp file path
        used_seed = result.data[1] if len(result.data) > 1 else seed

        # Convert to PIL Image if needed
        if isinstance(image_output, str) and os.path.exists(image_output):
            img = Image.open(image_output)
        else:
            img = image_output  # Already a PIL Image in most cases

        # Create filename with timestamp + seed
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"z_image_turbo_{timestamp}_seed_{used_seed}.png"
        
        # Save in current folder (or create a folder)
        save_folder = "generated_images"
        os.makedirs(save_folder, exist_ok=True)
        save_path = os.path.join(save_folder, filename)

        img.save(save_path)
        
        print(f"✅ Success!")
        print(f"   Image saved as: {save_path}")
        print(f"   Seed used: {used_seed}")
        print(f"   Size: {img.size}")
        
        return save_path

    except Exception as e:
        print(f"❌ Error: {e}")
        print("Tip: If you get endpoint error, run `print(client.view_api())` to check the exact api_name")
        return None


# ====================== Usage ======================

if __name__ == "__main__":
    # Example usage
    user_prompt = input("Enter your image prompt: ").strip()
    
    if not user_prompt:
        user_prompt = "A majestic dragon soaring through clouds at sunset, scales shimmering with iridescent colors, detailed fantasy art style"
        print("Using default prompt...")

    # Generate and save
    saved_file = generate_and_save(
        prompt=user_prompt,
        height=1024,
        width=1024,
        steps=9,
        seed=42,
        randomize=False   # Set True for random seed each time
    )

    if saved_file:
        print(f"\nImage is ready in the 'generated_images' folder!")