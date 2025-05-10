export class DataUtils {
  static generateUniqueUsername(firstName: string, middleName: string, lastName: string): string {
    // Lấy ký tự đầu tiên của firstName và middleName (nếu có)
    const firstInitial = firstName ? firstName.charAt(0).toLowerCase() : '';
    const middleInitial = middleName ? middleName.charAt(0).toLowerCase() : '';

    // Kết hợp thành username
    return `${lastName.toLowerCase()}${firstInitial}${middleInitial}`;
  }

}
