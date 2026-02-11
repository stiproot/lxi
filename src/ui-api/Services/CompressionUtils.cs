using System.IO.Compression;
using System.Text;

namespace Services;

/// <summary>
/// The utility to compress and decompress json.
/// </summary>
public static class CompressionUtils
{
  /// <summary>
  /// Compress JSON content into bytes
  /// </summary>
  /// <param name="json">The JSON content to compress.</param>
  /// <returns>The compressed JSON content in bytes format.</returns>
  public static byte[] CompressJson(string json)
  {
    byte[] jsonBytes = Encoding.UTF8.GetBytes(json);

    using MemoryStream memoryStream = new();
    using (var gzipStream = new GZipStream(memoryStream, CompressionMode.Compress))
    {
      gzipStream.Write(jsonBytes, 0, jsonBytes.Length);
    }

    return memoryStream.ToArray();
  }

  /// <summary>
  /// Decompress bytes into JSON
  /// </summary>
  /// <param name="compressedBytes">The compressed JSON content in bytes format.</param>
  /// <returns>The decompressed JSON content in string format.</returns>
  public static string DecompressJson(byte[] compressedBytes)
  {
    using MemoryStream memoryStream = new(compressedBytes);
    using GZipStream gzipStream = new(memoryStream, CompressionMode.Decompress);
    using MemoryStream decompressedStream = new();

    gzipStream.CopyTo(decompressedStream);
    return Encoding.UTF8.GetString(decompressedStream.ToArray());
  }
}
