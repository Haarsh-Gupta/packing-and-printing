from abc import ABC, abstractmethod

class SMSProvider(ABC):
    # @abstractmethod
    # def send_sms(self, phone_number: str, message: str) -> bool:
    #     pass

    # @abstractmethod
    # def send_bulk_sms(self, phone_numbers: list[str], message: str) -> bool:
    #     pass

    @abstractmethod
    def send_otp(self, phone_number: str, otp: str) -> bool:
        """
        Send OTP to a phone number.
        Returns True if OTP was sent successfully, False otherwise.
        """
        pass