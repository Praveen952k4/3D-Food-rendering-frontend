# AR Food Ordering System - Complete Project Documentation

## 📋 Project Overview

This is an **Augmented Reality (AR) Food Ordering Application** that allows customers to view food items in 3D using their device camera, add items to cart, and complete orders through an integrated payment system.

**Project Type:** Web-based AR Restaurant Menu & Ordering System  
**Technology Stack:** HTML5, CSS3, JavaScript, Three.js, WebGL, GLTFLoader

---

## 🎯 Key Features

1. **AR 3D Model Viewer** - View food items as 3D models overlaid on live camera feed
2. **Interactive Menu System** - Browse categorized food items with visual buttons
3. **Shopping Cart Management** - Add/remove items with quantity controls
4. **Payment Integration** - Process payments through PhonePe API
5. **Order Tracking** - Success/failure notifications via Telegram Bot
6. **Responsive Design** - Mobile-first design optimized for smartphones

---

## 📁 Project Structure

```
ar-ph-2/
├── new1.html           # Main AR viewer page (Home)
├── script.js           # AR viewer functionality
├── style.css           # AR viewer styling
├── cart.html           # Shopping cart page
├── cart.js             # Cart logic & calculations
├── cart.css            # Cart styling
├── payment.html        # Checkout & payment form
├── payment.js          # Payment validation
├── payment.css         # Payment form styling
├── success.html        # Order success page
├── success.css         # Success page styling
├── failure.html        # Payment failure page
├── failure.css         # Failure page styling
├── camera.html         # Camera controls
├── camera_style.css    # Camera styling
├── summa.html          # Additional page
└── yourpage.html       # Additional page
```

---

## 🔍 Detailed File Breakdown

### 1. **new1.html** - Main AR Viewer (Home Page)

**Purpose:** Primary landing page with AR 3D food model viewer

#### UI Components:

- **Video Background** (`<video>` element)
  - Displays live camera feed from device
  - Uses `getUserMedia` API to access back camera
  - Full-screen overlay behind 3D models

- **Top Title Bar** (`#top-title`)
  - Shows selected food name and price
  - Positioned at top center (3% from top)
  - Rounded background with semi-transparent styling

- **3D Model Container** (`#model-container`)
  - WebGL canvas for rendering 3D food models
  - Managed by Three.js library
  - Supports touch gestures (rotate, zoom, pan)

- **Scrollable Button Bar** (`buttons-container`)
  - Horizontal scrolling food selection buttons
  - 19 circular buttons (60px diameter)
  - Each button has unique food image background
  - Positioned at 82% from top

- **Bottom Action Bar** (`image-container`)
  - Decrement button (minus icon)
  - Shopping cart button with item count badge
  - Increment button (plus icon)
  - Rounded top corners, fixed at bottom

- **Right Side Menu** (`containers`)
  - Search icon (magnifying glass)
  - Ingredients button (bowl icon)
  - Menu button (newspaper icon)
  - Stacked vertically at top-right (90% from left)

- **Ingredients Popup** (`#smallPage1`)
  - Modal overlay (currently commented out)
  - Shows ingredient list with quantity inputs
  - 70% width/height, centered, scrollable

- **Menu Popup** (`#smallPage2`)
  - Dropdown menu categories:
    - Starters (Arrow Chicken, Dragon Chicken)
    - Tandoori (Paneer Tikka, Chicken Tikka)
    - Indian (Chicken 65, Malabar Chicken)
    - Special Platter (Mixed Non-Veg, Veg)
    - Biryani (Chicken, Mutton)
  - Animated expand/collapse effects
  - SVG arrows rotate on hover

#### Key Functions:

**`init()`**
- Initializes Three.js scene, camera, renderer
- Sets up OrbitControls for 3D interaction
- Configures lighting (DirectionalLight intensity: 4)
- Loads initial 3D model (`25_6_2024.glb`)

**`loadModel(modelPath)`**
- Removes previous 3D model from scene
- Uses GLTFLoader to load `.glb` files
- Centers model at (0, 0, 0)
- Triggers render loop

**`handleClick(buttonId, model)`**
- Highlights clicked food button (orange outline)
- Loads corresponding 3D model
- Updates food name display
- Stores current selection in `presentLocation`

**`increment(item)`**
- Adds +1 to selected food item count
- Updates localStorage `foodItems` array
- Increments `totalCount` for cart badge
- Shows alert if no food selected

**`decrement(item)`**
- Subtracts -1 from food item count
- Prevents negative quantities
- Updates localStorage
- Shows alert at zero quantity

**`foodName(foodName)`**
- Extracts food name from .glb filename
- Displays "Rs. 100 - [FoodName]" in top title
- Removes file extension (.glb)

**`getCartTotal()`**
- Retrieves total count from localStorage
- Updates cart badge number (`#cartCountCircle`)

#### LocalStorage Structure:
```javascript
foodItems = [
  {
    name: "Chapati",
    buttonListId: "button1",
    price: 100.0,
    count: 2,
    web: "image_url"
  },
  // ... more items
]
totalCount = 5  // Sum of all item counts
```

---

### 2. **cart.html** - Shopping Cart

**Purpose:** Review selected items, adjust quantities, proceed to checkout

#### UI Components:

- **Header** (`header-container`)
  - Back arrow icon (links to `new1.html`)
  - "Cart" title text

- **Food Items List** (`#food-item`)
  - Dynamically generated from localStorage
  - Each item shows:
    - Food image (circular, 23% width)
    - Name (truncated to 12 characters)
    - Price (per item × quantity)
    - Quantity controls (+/- buttons)

- **Promo Code Section** (`promo-code`)
  - Text input field (rounded left)
  - Orange "Apply" button (rounded right)

- **Billing Summary** (`item-summary`)
  - Subtotal (sum of all items)
  - Tax and Fees (5% of subtotal)
  - Grand Total (subtotal + tax)
  - Item count display

- **Checkout Button** (`#checkout-button`)
  - Full-width orange button
  - Triggers payment API call
  - Shows loading spinner during processing

- **Loading Overlay** (`#loaderOverlay`)
  - Semi-transparent black background
  - Animated spinner (40px, orange border-top)

#### Key Functions:

**`displayCartItems()`**
- Loops through localStorage `foodItems`
- Creates HTML for each item with count > 0
- Calculates subtotal, tax (5%), grand total
- Updates DOM elements dynamically

**`increment(item)`**
- Increases item count by 1
- Updates localStorage
- Recalculates prices and totals
- Updates UI without page reload

**`decrement(item)`**
- Decreases item count by 1
- Hides item container if count reaches 0
- Recalculates billing summary
- Updates localStorage

**`redirectToPaymentLink()`**
- Generates unique `linkId`: `{phone}{year-mm-dd-hh-mm-ss}`
- Calls PhonePe payment API:
  ```
  GET https://ap8pp3x3dg.execute-api.ap-south-1.amazonaws.com/test/hi
  ?link_id={linkId}&total={totalAmount}&name={customerName}&phoneNumber={customerMobileNumber}
  ```
- Redirects to payment gateway on success
- Shows loader during API call
- Handles errors gracefully

**Telegram Integration:**
- Constructs order message with customer details
- Sends to Telegram bot API:
  ```
  GET https://s12j4nb21k.execute-api.ap-south-1.amazonaws.com/message/telFunc
  ?token={bot_token}&chat_id=-4542112220&message={encodedMessage}
  ```
- Message format:
  ```
  Name: Pradeep S
  Phone: +91 8838909289
  Order Details:
     1. Onion Dosa
     2. Burger
     3. Chicken Pizza
  ```

---

### 3. **payment.html** - Checkout Page

**Purpose:** Collect billing info, payment method, confirm order

#### UI Components:

- **Billing Section** (`billing-section`)
  - **Name Field** (text input)
    - Error message: "Name is required."
  - **Email Field** (email input)
    - Validates format with regex
    - Error: "Please enter a valid email address."
  - **Phone Field** (tel input)
    - Must be 10 digits
    - Error: "Please enter a valid phone number."

- **Payment Method Section** (`payment-section`)
  - **PayPal Option** (radio button)
    - PayPal logo image
    - Info text: "You will be redirected..."
  - **Credit Card Option** (radio button)
    - Visa logo
    - Expandable card info fields:
      - Card Number (16 digits)
      - Expiry Date (MM/YY format)
      - CVC (3 digits)
      - "What is this?" help link
  - Security notice (encryption info)

- **Order Review Section** (`order-review-section`)
  - Item thumbnails (50px × 50px)
  - Item names and prices
  - Remove button (× icon)
  - **Table Number Input** (text)
  - **Order Comment** (textarea)
    - Placeholder: "Type here..."

- **Billing Summary** (`billing-summary-section`)
  - Subtotal: ₹200.00
  - Discount: -₹0.00
  - Tax: ₹17.00
  - **Grand Total: ₹217.00**
  - "(Inclusive of all Tax)" note

- **Terms & Policy Checkbox**
  - Must be checked to proceed
  - Links to Privacy & Terms Policy

- **Pay Button** (`pay-btn`)
  - Full-width orange button
  - Shows total amount
  - Links to `summa.html`

#### Key Functions:

**`increaseQuantity(element)`**
- Increments quantity input value
- Updates item price calculation

**`decreaseQuantity(element)`**
- Decrements quantity (min: 1)
- Updates item price calculation

**`removeItem(element)`**
- Removes entire order item from DOM
- Updates billing summary

**Credit Card Toggle:**
- Shows/hides card info fields based on selected payment method
- PayPal: hides card fields
- Credit Card: shows card fields

**Form Validation (on submit):**
1. **Name Validation**
   - Checks if empty
   - Shows error message below field

2. **Email Validation**
   - Regex pattern: `/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/`
   - Checks format validity

3. **Phone Validation**
   - Regex pattern: `/^[0-9]{10}$/`
   - Ensures exactly 10 digits

4. **Card Validation (if credit card selected)**
   - Card Number: checks if empty
   - Expiry Date: checks if empty
   - CVC: checks if empty

5. **Terms Checkbox**
   - Must be checked
   - Error: "You must acknowledge the Privacy & Terms Policy."

6. **Submit Behavior**
   - Prevents form submission if invalid (`event.preventDefault()`)
   - Shows all error messages simultaneously
   - Focuses on first error field

---

### 4. **success.html** - Order Confirmation

**Purpose:** Confirm successful order placement

#### UI Components:

- **Status Icon** (`status-icon success`)
  - Green checkmark (✓)
  - Large, centered circular background

- **Success Message**
  - Heading: "Order successfully"
  - Subtext: "Your Order has been processed successfully."

- **Done Button**
  - Redirects to `new1.html`
  - Clears localStorage
  - Resets cart to empty state

#### Key Functions:

**`redirectToHome()`**
- Navigates back to home page
- Executes `localStorage.clear()`
- Re-initializes empty `foodItems` array
- Resets `totalCount` to 0
- Ensures fresh start for next order

---

### 5. **failure.html** - Payment Failed

**Purpose:** Handle payment errors and retry

#### UI Components:

- **Status Icon** (`status-icon failed`)
  - Red cross (✕)
  - Large, centered circular background

- **Failure Message**
  - Heading: "Order Failed"
  - Subtext: "Unfortunately, your Order could not be processed."

- **Try Again Button** (`#retryPayment`)
  - Retries payment API call
  - Shows loading spinner

- **Loading Overlay** (same as cart page)

#### Key Functions:

**`fetchAPI()`**
- Retries Telegram bot notification
- Same API endpoint as cart page
- Success: redirects to `success.html` after 1s delay
- Failure: stays on failure page
- Shows/hides spinner during process

**Error Handling:**
- Catches network errors
- Provides retry mechanism
- User-friendly error messages

---

## 🎨 Styling Details

### **style.css** - AR Viewer Styles

- **Button Backgrounds:** Each button (#button1-#button20) has unique food image
- **Button Highlight:** Orange outline (3px solid) on selected item
- **Menu Animations:** 
  - Transform: scaleX(0) → scaleX(1) on hover
  - Cubic bezier easing: (0.23, 1, 0.32, 1)
  - Rotation: SVG arrows rotate -180deg
- **Cart Badge:** Orange circle (#ec920c), 15px diameter, positioned over cart icon
- **Scrollbar:** Hidden with `::-webkit-scrollbar { width: 0px }`

### **cart.css** - Cart Page Styles

- **Color Scheme:** Orange accent (#ff8a65), white background
- **Item Layout:** Flexbox with image (23% width), info (35%), controls
- **Buttons:** Orange background, white text, rounded corners
- **Loader:** Rotating border animation (2s linear infinite)
- **Shadows:** Subtle box-shadow (0 2px 4px rgba(0,0,0,0.1))

### **payment.css** - Checkout Styles

- **Form Inputs:** Border (2px #000), rounded corners (5px)
- **Labels:** Positioned above inputs with background overlap
- **Error Messages:** Red color, initially `display: none`
- **Summary Items:** Flexbox space-between alignment
- **Pay Button:** Full-width, 40px border-radius, hover effect

---

## 🔄 User Flow

1. **Landing (new1.html)**
   - Camera activates automatically
   - User sees food buttons at bottom
   - Clicks button → 3D model loads
   - Uses +/- to adjust quantity
   - Cart badge updates

2. **Cart Review (cart.html)**
   - Sees all selected items
   - Can adjust quantities or remove items
   - Views subtotal, tax, grand total
   - Optional: enters promo code
   - Clicks "Checkout"

3. **Payment (payment.html)**
   - Fills billing information
   - Selects payment method
   - Enters card details (if applicable)
   - Reviews order summary
   - Enters table number & comments
   - Agrees to terms
   - Clicks "Pay"

4. **Confirmation**
   - **Success (success.html):** Shows checkmark, redirects home
   - **Failure (failure.html):** Shows error, allows retry

---

## 🛠️ Technical Implementation

### **Three.js 3D Rendering**

```javascript
// Scene Setup
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(65, aspectRatio, 0.1, 1000);
renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 4);
light.position.set(2, 2, 5).normalize();

// Controls
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Model Loading
const loader = new THREE.GLTFLoader();
loader.load(modelPath, (gltf) => {
  model = gltf.scene;
  model.position.set(0, 0, 0);
  scene.add(model);
});
```

### **Camera Access**

```javascript
navigator.mediaDevices.getUserMedia({ 
  video: { facingMode: "environment" } 
})
.then(stream => {
  video.srcObject = stream;
  video.play();
});
```

### **LocalStorage Management**

```javascript
// Save data
localStorage.setItem('foodItems', JSON.stringify(foodItems));
localStorage.setItem('totalCount', totalCount.toString());

// Retrieve data
let foodItems = JSON.parse(localStorage.getItem('foodItems'));
let totalCount = parseInt(localStorage.getItem('totalCount'));
```

---

## 🔌 API Integrations

### **1. PhonePe Payment Gateway**

**Endpoint:** `https://ap8pp3x3dg.execute-api.ap-south-1.amazonaws.com/test/hi`

**Parameters:**
- `link_id`: Unique order identifier
- `total`: Order amount
- `name`: Customer name
- `phoneNumber`: Customer phone

**Response:**
```json
{
  "status_code": 200,
  "payment_link": "https://phonepe.com/payment/..."
}
```

### **2. Telegram Bot Notification**

**Endpoint:** `https://s12j4nb21k.execute-api.ap-south-1.amazonaws.com/message/telFunc`

**Parameters:**
- `token`: Bot authentication token
- `chat_id`: Restaurant group chat ID (-4542112220)
- `message`: URL-encoded order details

**Purpose:** Sends order notification to restaurant staff

---

## 📱 Responsive Design

- **Mobile-First Approach:** Optimized for 360px - 480px width
- **Touch Gestures:** 
  - Pinch to zoom (3D models)
  - Swipe to rotate (OrbitControls)
  - Horizontal scroll (food buttons)
- **Viewport Meta:** `width=device-width, initial-scale=1.0`
- **Flexible Units:** Percentages and `em` for scaling

---

## 🐛 Error Handling

1. **Camera Permission Denied**
   - Console error logged
   - Graceful fallback (video element hidden)

2. **Model Loading Failure**
   - Console error with model path
   - Previous model remains visible

3. **API Failures**
   - Network errors caught with `.catch()`
   - Loader hidden
   - Redirects to failure page

4. **Form Validation**
   - Real-time error messages
   - Prevents submission until valid
   - Highlights problematic fields

---

## 🔐 Security Considerations

1. **Payment Data:** Handled by PhonePe (PCI-DSS compliant)
2. **API Keys:** Exposed in client-side code (⚠️ security risk)
3. **Input Validation:** Client-side only (needs server-side validation)
4. **HTTPS Required:** For getUserMedia camera access

---

## 🚀 Future Enhancements

1. **Backend Integration:** Move API keys to server
2. **User Authentication:** Login/signup system
3. **Order History:** Database for past orders
4. **Multi-language:** i18n support
5. **Dietary Filters:** Veg/non-veg, allergens
6. **AR Markers:** Marker-based AR placement
7. **Social Sharing:** Share 3D food views
8. **Reviews & Ratings:** User feedback system

---

## 📊 Performance Metrics

- **3D Model Size:** Average 2-5 MB per .glb file
- **Initial Load Time:** ~3-5 seconds (depends on network)
- **Frame Rate:** 30-60 FPS (device-dependent)
- **Memory Usage:** ~50-100 MB (Three.js overhead)

---

## 🧪 Testing Checklist

- [ ] Camera access on different devices
- [ ] 3D model rotation/zoom
- [ ] Add/remove cart items
- [ ] LocalStorage persistence
- [ ] Payment API response handling
- [ ] Form validation (all fields)
- [ ] Success/failure redirects
- [ ] Cross-browser compatibility
- [ ] Network failure scenarios
- [ ] Mobile touch interactions

---

## 📞 Contact & Support

**Project Name:** ar-ph-4  
**Repository:** GitHub - Pradeep2535/ar-ph-4  
**Branch:** main  

**Customer Support:**
- Phone: +91 8838909289
- Developer: Pradeep S

---

## 📜 License

All rights reserved © 2025

---

**Last Updated:** November 26, 2025
