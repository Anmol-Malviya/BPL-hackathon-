import sys
import subprocess

def main():
    # Install qrcode library if not present
    try:
        import qrcode
    except ImportError:
        print("Installing qrcode library...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode", "pillow"])
        import qrcode

    # We use a simulated phishing URL for testing
    url = "http://secure-paypal-login-update.com"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    output_path = "./public/simulated_phishing_qr.png"
    img.save(output_path)
    print(f"Success! Generated test QR code containing '{url}' at: {output_path}")

if __name__ == "__main__":
    main()
