import verifyToken        from "../services/msg91.services.js"
import Driver             from "../Models/Driver.models.js"
import apiError           from "../Utils/apiError.utils.js"
import uploadToCloudinary from "../services/cloudinary.servies.js"

const driverRegister = async (req, res) => {
  const { accessToken, name, vehicleNumber, vehicleType, email } = req.body

  if (!accessToken)    return res.status(400).json({ success: false, error: "accessToken is required" })
  if (!name)           return res.status(400).json({ success: false, error: "Name is required" })
  if (!vehicleNumber)  return res.status(400).json({ success: false, error: "Vehicle number is required" })
  if (!vehicleType)    return res.status(400).json({ success: false, error: "Vehicle type is required" })

  if (!req.files?.photo?.[0])   return res.status(400).json({ success: false, error: "Driver photo is required" })
  if (!req.files?.license?.[0]) return res.status(400).json({ success: false, error: "License document is required" })

  try {
    const mobile      = await verifyToken(accessToken)
    const phoneNumber = `+${mobile}`

    const existingDriver = await Driver.findOne({
      $or: [
        { phoneNumber },
        { vehicleNumber: vehicleNumber.toUpperCase() }
      ]
    })

    if (existingDriver) {
      const conflict = existingDriver.phoneNumber === phoneNumber
        ? "phone number"
        : "vehicle number"
      throw new apiError(409, `A driver with this ${conflict} already exists`)
    }

    const photoResult   = await uploadToCloudinary(
      req.files.photo[0].buffer,
      { folder: "resqride/drivers/photos",   public_id: `photo_${mobile}` }
    )
    const licenseResult = await uploadToCloudinary(
      req.files.license[0].buffer,
      { folder: "resqride/drivers/licenses", public_id: `license_${mobile}` }
    )

    const driver = await Driver.create({
      name,
      phoneNumber,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      email:       email || undefined,
      accStatus:   "Pending",
      
      driverPhoto: photoResult,
      documents: [{
        type:       "Driver's License",
        public_id:  licenseResult.public_id,
        secure_url: licenseResult.secure_url,
        format:     licenseResult.format,
        bytes:      licenseResult.bytes,
        isVerified: false,
      }]
    })

    return res.status(201).json({
      success: true,
      message: "Registration submitted. Await admin approval before logging in.",
      data: {
        driverId:    driver._id,
        phoneNumber: driver.phoneNumber,
        accStatus:   driver.accStatus,
      }
    })

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error"
    })
  }
}

export default driverRegister