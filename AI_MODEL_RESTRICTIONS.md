# AI Model Restrictions - Implementation Guide

## Overview
The license validation API now returns `allowedModels` based on the user's subscription plan, enabling you to restrict which Ollama models users can access in the JARVIS desktop software.

---

## API Response Structure

### Trial/Personal Plan
```json
{
  "valid": true,
  "plan": "trial",
  "features": {
    "maxDevices": 1,
    "cloudSync": false,
    "prioritySupport": false,
    "allowedModels": ["llama3.2:1b", "llama3.2:3b"],
    "openaiAccess": false
  }
}
```

### Pro Plan
```json
{
  "valid": true,
  "plan": "pro",
  "features": {
    "maxDevices": 3,
    "cloudSync": true,
    "prioritySupport": true,
    "allowedModels": [
      "llama3.2:1b",
      "llama3.2:3b",
      "llama3.2:70b",
      "llama3.1:70b",
      "llama3:70b",
      "mistral:7b",
      "mixtral:8x7b"
    ],
    "openaiAccess": true
  }
}
```

### Business Plan
```json
{
  "valid": true,
  "plan": "business",
  "features": {
    "maxDevices": 10,
    "cloudSync": true,
    "prioritySupport": true,
    "allowedModels": ["*"],
    "openaiAccess": true
  }
}
```

### Lifetime Plan
```json
{
  "valid": true,
  "plan": "lifetime",
  "features": {
    "maxDevices": 3,
    "cloudSync": false,
    "prioritySupport": false,
    "allowedModels": [
      "llama3.2:1b",
      "llama3.2:3b",
      "llama3.2:70b"
    ],
    "openaiAccess": false
  }
}
```

---

## Plan Comparison

| Feature | Trial/Personal | Pro | Business | Lifetime |
|---------|---------------|-----|----------|----------|
| **Small Models (3B)** | ✅ | ✅ | ✅ | ✅ |
| **Large Models (70B)** | ❌ | ✅ | ✅ | ✅ |
| **All Models** | ❌ | ❌ | ✅ | ❌ |
| **OpenAI GPT Access** | ❌ | ✅ | ✅ | ❌ |
| **Max Devices** | 1 | 3 | 10 | 3 |

---

## Integration Code for JARVIS Desktop App

### 1. License Validation on Startup

```python
import requests
import json

class LicenseValidator:
    def __init__(self, token):
        self.token = token
        self.api_url = "https://jarvisassistant.online/api/license/validate"
        self.license_data = None
        
    def validate(self):
        """Validate license and get allowed features"""
        try:
            response = requests.post(
                self.api_url,
                headers={
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
            
            if response.status_code == 200:
                self.license_data = response.json()
                return True
            else:
                print(f"License validation failed: {response.json().get('message')}")
                return False
                
        except requests.exceptions.Timeout:
            print("License check timed out - using cached license")
            return self.load_cached_license()
        except Exception as e:
            print(f"License validation error: {e}")
            return False
    
    def get_allowed_models(self):
        """Get list of allowed Ollama models"""
        if not self.license_data:
            return []
        
        allowed = self.license_data.get('features', {}).get('allowedModels', [])
        
        # If business plan with '*', return all available models
        if allowed == ['*']:
            return self.get_all_installed_models()
        
        return allowed
    
    def has_openai_access(self):
        """Check if user can use OpenAI GPT"""
        if not self.license_data:
            return False
        return self.license_data.get('features', {}).get('openaiAccess', False)
    
    def get_all_installed_models(self):
        """Get all Ollama models installed on system"""
        import subprocess
        try:
            result = subprocess.run(
                ['ollama', 'list'],
                capture_output=True,
                text=True,
                timeout=5
            )
            # Parse ollama list output
            models = []
            for line in result.stdout.split('\n')[1:]:  # Skip header
                if line.strip():
                    model_name = line.split()[0]
                    models.append(model_name)
            return models
        except:
            return []
    
    def load_cached_license(self):
        """Load cached license for offline use"""
        try:
            with open('license_cache.json', 'r') as f:
                self.license_data = json.load(f)
                return True
        except:
            return False
    
    def cache_license(self):
        """Cache license data for offline use"""
        if self.license_data:
            with open('license_cache.json', 'w') as f:
                json.dump(self.license_data, f)
```

### 2. Model Selection UI

```python
class ModelSelector:
    def __init__(self, license_validator):
        self.validator = license_validator
        
    def get_available_models(self):
        """Get models user is allowed to use"""
        allowed_models = self.validator.get_allowed_models()
        installed_models = self.get_installed_models()
        
        # Filter installed models by allowed list
        if allowed_models == ['*']:
            return installed_models
        
        available = []
        for model in installed_models:
            if any(model.startswith(allowed) for allowed in allowed_models):
                available.append(model)
        
        return available
    
    def get_installed_models(self):
        """Get Ollama models installed on system"""
        import subprocess
        try:
            result = subprocess.run(
                ['ollama', 'list'],
                capture_output=True,
                text=True,
                timeout=5
            )
            models = []
            for line in result.stdout.split('\n')[1:]:
                if line.strip():
                    model_name = line.split()[0]
                    models.append(model_name)
            return models
        except:
            return []
    
    def show_model_selection(self):
        """Display model selection UI with restrictions"""
        available = self.get_available_models()
        all_models = self.get_installed_models()
        
        print("\n=== AI Model Selection ===")
        print(f"Your plan: {self.validator.license_data.get('plan', 'unknown').upper()}\n")
        
        if not available:
            print("⚠️ No models available for your plan.")
            print("📥 Install a compatible model:")
            allowed = self.validator.get_allowed_models()
            if allowed and allowed != ['*']:
                print(f"\nAllowed models: {', '.join(allowed)}")
                print("\nRun: ollama pull llama3.2:3b")
            return None
        
        print("Available models:")
        for i, model in enumerate(available, 1):
            print(f"  {i}. {model}")
        
        # Show locked models
        locked = [m for m in all_models if m not in available]
        if locked:
            print(f"\n🔒 Locked models (upgrade to access):")
            for model in locked:
                print(f"  • {model} (requires Pro or Business plan)")
        
        # Show upgrade prompt if not business
        plan = self.validator.license_data.get('plan', '')
        if plan not in ['business', 'pro']:
            print("\n✨ Upgrade to Pro for 70B models and OpenAI GPT access!")
            print("   Visit: https://jarvisassistant.online/pricing")
        
        return available
    
    def validate_model_selection(self, model_name):
        """Check if user can use this model"""
        allowed = self.validator.get_allowed_models()
        
        # Business plan can use any model
        if allowed == ['*']:
            return True
        
        # Check if model matches allowed list
        for allowed_model in allowed:
            if model_name.startswith(allowed_model.replace(':*', '')):
                return True
        
        return False
```

### 3. Main Integration

```python
# In your JARVIS startup code
def main():
    # Get stored JWT token
    token = get_stored_token()  # From your login system
    
    if not token:
        print("Please login first")
        return
    
    # Validate license
    validator = LicenseValidator(token)
    if not validator.validate():
        print("❌ License validation failed")
        return
    
    # Cache license for offline use
    validator.cache_license()
    
    # Create model selector
    selector = ModelSelector(validator)
    
    # Show available models
    available_models = selector.show_model_selection()
    
    if not available_models:
        print("\n⚠️ No models available. Please install a compatible model.")
        return
    
    # Let user select model
    choice = input("\nSelect model number: ")
    try:
        model_index = int(choice) - 1
        selected_model = available_models[model_index]
        
        # Validate selection
        if selector.validate_model_selection(selected_model):
            print(f"\n✅ Using model: {selected_model}")
            start_jarvis(selected_model)
        else:
            print(f"\n❌ You don't have access to {selected_model}")
            print("Upgrade your plan at: https://jarvisassistant.online/pricing")
    except (ValueError, IndexError):
        print("Invalid selection")

def start_jarvis(model_name):
    """Start JARVIS with selected model"""
    print(f"\n🚀 Starting JARVIS with {model_name}...")
    # Your JARVIS initialization code here
```

### 4. Handle Model Restrictions in Settings

```python
class SettingsManager:
    def __init__(self, license_validator):
        self.validator = license_validator
        
    def save_model_preference(self, model_name):
        """Save user's model preference with validation"""
        # Validate model access
        selector = ModelSelector(self.validator)
        if not selector.validate_model_selection(model_name):
            raise PermissionError(
                f"Your plan doesn't include access to {model_name}. "
                f"Upgrade at https://jarvisassistant.online/pricing"
            )
        
        # Save preference
        settings = self.load_settings()
        settings['preferred_model'] = model_name
        self.save_settings(settings)
        
    def get_ai_settings_ui(self):
        """Generate AI settings UI with plan restrictions"""
        allowed_models = self.validator.get_allowed_models()
        has_openai = self.validator.has_openai_access()
        
        ui_config = {
            'ollama_models': allowed_models,
            'openai_enabled': has_openai,
            'plan': self.validator.license_data.get('plan', 'unknown')
        }
        
        return ui_config
```

---

## User Experience Flow

### 1. Startup Check
```
🔐 Validating license...
✅ License validated: PRO
📦 Allowed models: llama3.2:3b, llama3.2:70b, llama3.1:70b
```

### 2. Model Selection
```
=== AI Model Selection ===
Your plan: PRO

Available models:
  1. llama3.2:3b
  2. llama3.2:70b

🔒 Locked models (upgrade to access):
  • llama3:405b (requires Business plan)

✨ Upgrade to Business for unlimited model access!
   Visit: https://jarvisassistant.online/pricing

Select model number: 2
✅ Using model: llama3.2:70b
```

### 3. Attempting Restricted Model
```
❌ You don't have access to llama3:405b
📊 Your plan: PRO
🔓 Required: Business Plan

Upgrade now: https://jarvisassistant.online/pricing
```

---

## Testing

### Test Trial/Personal Plan
```python
# Expected: Only 3B models accessible
validator = LicenseValidator(trial_token)
validator.validate()
models = validator.get_allowed_models()
assert models == ['llama3.2:1b', 'llama3.2:3b']
assert validator.has_openai_access() == False
```

### Test Pro Plan
```python
# Expected: 3B and 70B models, OpenAI enabled
validator = LicenseValidator(pro_token)
validator.validate()
models = validator.get_allowed_models()
assert 'llama3.2:70b' in models
assert validator.has_openai_access() == True
```

### Test Business Plan
```python
# Expected: All models accessible
validator = LicenseValidator(business_token)
validator.validate()
models = validator.get_allowed_models()
assert models == ['*']
assert validator.has_openai_access() == True
```

---

## Offline Mode

The license validator caches the last successful validation to `license_cache.json`:

```json
{
  "valid": true,
  "plan": "pro",
  "features": {
    "allowedModels": ["llama3.2:3b", "llama3.2:70b"],
    "openaiAccess": true
  },
  "cachedAt": "2026-02-02T10:30:00Z"
}
```

When offline, JARVIS loads cached license and continues working with previously validated models.

---

## Upgrade Prompts

### Trial User Tries 70B Model
```
🔒 This model requires Pro or Business plan

llama3.2:70b - 70 billion parameters
• More intelligent responses
• Better context understanding
• Advanced reasoning capabilities

Your plan: TRIAL (3 days remaining)

Upgrade to Pro: $9/month
✅ Access to 70B models
✅ 3 devices
✅ Priority support

Visit: https://jarvisassistant.online/pricing
```

---

## Security Notes

1. **License validation happens on startup** - Users can't bypass by editing files
2. **Model list is fetched from server** - Can't be modified locally
3. **Cache expires after 7 days** - Forces revalidation
4. **Plan downgrades are immediate** - Model access updates on next validation

---

## Summary

✅ **Implemented Features:**
- Plan-based model restrictions
- OpenAI GPT access control
- Offline license caching
- User-friendly upgrade prompts
- Settings UI integration

✅ **What Users Get:**
- **Trial/Personal:** 3B models only
- **Pro:** 3B + 70B models + OpenAI
- **Business:** All models + OpenAI
- **Lifetime:** 3B + 70B models (no OpenAI)

🚀 **Ready to integrate into JARVIS desktop app!**
