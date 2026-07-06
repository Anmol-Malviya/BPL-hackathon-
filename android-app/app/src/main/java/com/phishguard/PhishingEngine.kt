package com.phishguard

import java.net.URI
import java.net.URL
import kotlin.math.exp
import java.util.regex.Pattern

object PhishingEngine {

    data class Result(
        val url: String,
        val domain: String,
        val isSafe: Boolean,
        val score: Int,          // Safety score 0-100 (100 is completely safe)
        val rating: String,      // "SAFE", "SUSPICIOUS", "DANGEROUS"
        val warnings: List<String>
    )

    private val TOP_BRANDS = listOf(
        "google.com", "facebook.com", "apple.com", "microsoft.com", 
        "amazon.com", "netflix.com", "paypal.com", "instagram.com", 
        "twitter.com", "yahoo.com", "linkedin.com", "zoom.us", 
        "chase.com", "bankofamerica.com", "wellsfargo.com", "citibank.com",
        "github.com", "gmail.com", "outlook.com", "coinbase.com", 
        "binance.com", "metamask.io"
    )

    private val SHORTENERS = listOf(
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", 
        "buff.ly", "adf.ly", "bit.do", "mcaf.ee", "su.pr", "rebrand.ly"
    )

    private val SUSPICIOUS_TLDS = listOf(
        "zip", "mov", "fit", "top", "tk", "ml", "ga", "cf", "gq", "work", 
        "click", "download", "racing", "stream", "win", "bid", "vip", "xyz",
        "ru", "cn", "su", "buzz", "date", "icu", "loan", "men", "xin"
    )

    private val SENSITIVE_WORDS = listOf(
        "confirm", "account", "banking", "secure", "login", "signin", 
        "verify", "webscr", "ebayisapi", "update", "password", "credential",
        "wallet", "auth", "recover", "claim", "free", "gift", "award"
    )

    // Levenshtein cache
    private val levenshteinCache = HashMap<String, Int>()

    private fun getLevenshteinDistance(a: String, b: String): Int {
        val key = "$a:$b"
        if (levenshteinCache.containsKey(key)) return levenshteinCache[key]!!
        val revKey = "$b:$a"
        if (levenshteinCache.containsKey(revKey)) return levenshteinCache[revKey]!!

        val dp = Array(a.length + 1) { IntArray(b.length + 1) }

        for (i in 0..a.length) {
            dp[i][0] = i
        }
        for (j in 0..b.length) {
            dp[0][j] = j
        }

        for (i in 1..a.length) {
            for (j in 1..b.length) {
                if (a[i - 1] == b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]
                } else {
                    dp[i][j] = minOf(
                        dp[i - 1][j - 1] + 1, // substitution
                        dp[i - 1][j] + 1,     // deletion
                        dp[i][j - 1] + 1      // insertion
                    )
                }
            }
        }
        val result = dp[a.length][b.length]
        levenshteinCache[key] = result
        return result
    }

    private fun calculateShannonEntropy(str: String): Double {
        val len = str.length
        if (len == 0) return 0.0
        val freqs = HashMap<Char, Int>()
        for (ch in str) {
            freqs[ch] = (freqs[ch] ?: 0) + 1
        }
        var entropy = 0.0
        for (count in freqs.values) {
            val p = count.toDouble() / len
            entropy -= p * (Math.log(p) / Math.log(2.0))
        }
        return entropy
    }

    private fun extractPrimaryDomainName(hostname: String): String {
        if (hostname.isEmpty()) return ""
        val domainParts = hostname.replace(Regex("^www\\."), "").split(".")
        if (domainParts.size < 2) return hostname

        val lastPart = domainParts.last()
        val secondLastPart = domainParts[domainParts.size - 2]

        val commonRegistryTlds = listOf("co", "com", "org", "net", "gov", "edu", "asn", "id", "ac")
        val isMultiPartSuffix = lastPart.length == 2 && commonRegistryTlds.contains(secondLastPart)

        return if (isMultiPartSuffix && domainParts.size >= 3) {
            domainParts[domainParts.size - 3]
        } else {
            domainParts[domainParts.size - 2]
        }
    }

    private fun countOccurrences(str: String, word: String): Int {
        var count = 0
        var pos = str.indexOf(word)
        while (pos != -1) {
            count++
            pos = str.indexOf(word, pos + 1)
        }
        return count
    }

    fun verifyUrl(urlString: String): Result {
        val rawUrl = urlString.trim()
        if (rawUrl.isEmpty()) {
            return Result(rawUrl, "", true, 100, "SAFE", listOf("Empty URL"))
        }

        var parsedUrl: URI? = null
        var hostname = ""
        var path = ""
        var protocol = ""
        var isValid = 0
        var isHttps = 0

        try {
            var urlToParse = rawUrl
            if (!urlToParse.startsWith("http://", ignoreCase = true) && 
                !urlToParse.startsWith("https://", ignoreCase = true)) {
                urlToParse = "https://$urlToParse"
            }
            parsedUrl = URI(urlToParse)
            hostname = parsedUrl.host?.toLowerCase() ?: ""
            path = parsedUrl.path ?: ""
            protocol = parsedUrl.scheme?.toLowerCase() ?: ""
            isValid = 1
            if (protocol == "https") isHttps = 1
        } catch (e: Exception) {
            isValid = 0
            val parts = rawUrl.split("/")
            hostname = parts.firstOrNull()?.toLowerCase() ?: ""
            path = if (parts.size > 1) rawUrl.substring(hostname.length) else ""
        }

        // Whitelist quick check
        val isWhitelisted = TOP_BRANDS.any { brand ->
            hostname == brand || hostname.endsWith(".$brand")
        }

        if (isWhitelisted && isHttps == 1) {
            return Result(
                url = rawUrl,
                domain = hostname,
                isSafe = true,
                score = 100,
                rating = "SAFE",
                warnings = emptyList()
            )
        }

        // Model feature extraction
        val urlLength = rawUrl.length
        val atSymbol = if (rawUrl.contains("@")) 1 else 0
        
        var sensitiveWordsCount = 0
        val lowerUrl = rawUrl.toLowerCase()
        for (word in SENSITIVE_WORDS) {
            sensitiveWordsCount += countOccurrences(lowerUrl, word)
        }
        
        val pathLength = path.length
        val nbDots = countOccurrences(rawUrl, ".")
        val nbHyphens = countOccurrences(rawUrl, "-")
        val nbAnd = countOccurrences(rawUrl, "&")
        val nbOr = countOccurrences(rawUrl, "|")
        val nbWww = countOccurrences(lowerUrl, "www")
        val nbCom = countOccurrences(lowerUrl, "com")
        val nbUnderscore = countOccurrences(rawUrl, "_")

        // ML normalization parameters (from phishing_model_weights.json)
        val means = mapOf(
            "url_length" to 57.9252, "valid_url" to 0.2801, "at_symbol" to 0.0084,
            "sensitive_words_count" to 0.2323, "path_length" to 16.2134, "isHttps" to 0.4277,
            "nb_dots" to 4.709, "nb_hyphens" to 0.5936, "nb_and" to 0.0153, "nb_or" to 0.1793,
            "nb_www" to 0.2295, "nb_com" to 0.6471, "nb_underscore" to 0.1403
        )

        val stds = mapOf(
            "url_length" to 20.1829, "valid_url" to 0.4491, "at_symbol" to 0.2446,
            "sensitive_words_count" to 0.4464, "path_length" to 18.8541, "isHttps" to 0.4947,
            "nb_dots" to 2.4244, "nb_hyphens" to 1.2514, "nb_and" to 0.1259, "nb_or" to 0.4291,
            "nb_www" to 0.4346, "nb_com" to 0.5373, "nb_underscore" to 0.5024
        )

        val weights = mapOf(
            "url_length" to 0.802, "valid_url" to 1.6832, "at_symbol" to -0.1313,
            "sensitive_words_count" to 0.2354, "path_length" to -0.6387, "isHttps" to 0.4263,
            "nb_dots" to -0.0477, "nb_hyphens" to 0.0966, "nb_and" to -0.0835, "nb_or" to -0.1758,
            "nb_www" to -0.6384, "nb_com" to 0.109, "nb_underscore" to -0.2232
        )
        val bias = 0.3105

        // Predict Z-score
        var z = bias
        val features = mapOf(
            "url_length" to urlLength.toDouble(), "valid_url" to isValid.toDouble(), "at_symbol" to atSymbol.toDouble(),
            "sensitive_words_count" to sensitiveWordsCount.toDouble(), "path_length" to pathLength.toDouble(), "isHttps" to isHttps.toDouble(),
            "nb_dots" to nbDots.toDouble(), "nb_hyphens" to nbHyphens.toDouble(), "nb_and" to nbAnd.toDouble(), "nb_or" to nbOr.toDouble(),
            "nb_www" to nbWww.toDouble(), "nb_com" to nbCom.toDouble(), "nb_underscore" to nbUnderscore.toDouble()
        )

        for ((feat, value) in features) {
            val mean = means[feat] ?: 0.0
            val std = stds[feat] ?: 1.0
            val weight = weights[feat] ?: 0.0
            val normalized = (value - mean) / std
            z += normalized * weight
        }

        // Logistic Regression Probability
        val mlProbability = 1.0 / (1.0 + exp(-z))
        val mlScore = (mlProbability * 100).toInt()

        // Heuristics Checks
        val warnings = ArrayList<String>()
        var riskScore = 0

        // Heuristics 1: Connection Security
        if (isHttps == 0) {
            warnings.add("• Insecure Connection: The link uses unencrypted HTTP protocol.")
            riskScore += 20
        }

        // Heuristics 2: IP Address in Hostname
        val ipPattern = Pattern.compile("^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$")
        val isIp = ipPattern.matcher(hostname).matches()
        if (isIp) {
            warnings.add("• IP Domain: Uses raw numerical IP address instead of domain name.")
            riskScore += 35
        }

        // Heuristics 3: URL Shortener
        val isShort = SHORTENERS.any { sh -> hostname == sh || hostname.endsWith(".$sh") }
        if (isShort) {
            warnings.add("• Masked Link: Uses a link shortener to hide destination website.")
            riskScore += 20
        }

        // Heuristics 4: Typosquatting & Brand Spoofing
        if (!isIp && hostname.isNotEmpty()) {
            val primaryName = extractPrimaryDomainName(hostname)
            var typosquatTarget: String? = null
            var brandAbuse = false

            // Contains Brand Name?
            for (brand in TOP_BRANDS) {
                val brandRaw = brand.split(".").first()
                if (hostname.contains(brandRaw) && !hostname.endsWith(".$brand") && hostname != brand) {
                    brandAbuse = true
                    typosquatTarget = brand
                    break
                }
            }

            // Closely resembles brand (Levenshtein check)?
            if (!brandAbuse) {
                var minDistance = 999
                for (brand in TOP_BRANDS) {
                    val brandRaw = brand.split(".").first()
                    if (primaryName != brandRaw) {
                        val dist = getLevenshteinDistance(primaryName, brandRaw)
                        if (dist in 1..2 && dist < minDistance) {
                            minDistance = dist;
                            typosquatTarget = brand
                        }
                    }
                }
            }

            if (typosquatTarget != null) {
                if (brandAbuse) {
                    warnings.add("• Brand Spoofing: Contains official trademark '${typosquatTarget.split('.').first()}' but is hosted on an unofficial server.")
                } else {
                    warnings.add("• Typosquatting: Domain mimics verified brand '$typosquatTarget' using typos.")
                }
                riskScore += 50
            }
        }

        // Heuristics 5: Sensitive Words Abuse
        if (sensitiveWordsCount > 0) {
            warnings.add("• Deceptive Keywords: URL paths use security/urgency words to trick you.")
            riskScore += 15
        }

        // Heuristics 6: Entropy (Random auto-generated names)
        if (!isIp && hostname.isNotEmpty()) {
            val primaryName = extractPrimaryDomainName(hostname)
            val entropy = calculateShannonEntropy(primaryName)
            if (primaryName.length > 8 && entropy > 4.1) {
                warnings.add("• Random Generated Domain: Characters in domain look scripted/random.")
                riskScore += 15
            }
        }

        // Heuristics 7: Dots count (Excess subdomains)
        if (nbDots > 4) {
            warnings.add("• Excessive Subdomains: Domain stacks nested parts to mask target.")
            riskScore += 15
        }

        // Heuristics 8: @ Symbol
        if (rawUrl.contains("@")) {
            warnings.add("• Deceptive Credentials: URL uses '@' to force browser redirection.")
            riskScore += 30
        }

        // Heuristics 9: IDN Homograph / Cyrillic characters
        val isPuny = hostname.split(".").any { it.startsWith("xn--") }
        if (isPuny) {
            warnings.add("• IDN Homograph Attack: Obfuscates text using Cyrillic/non-English script mappings.")
            riskScore += 60
        }

        // Heuristics 10: Suspicious TLD
        if (hostname.isNotEmpty() && !isIp) {
            val tld = hostname.split(".").last()
            if (SUSPICIOUS_TLDS.contains(tld)) {
                warnings.add("• High-Risk Domain TLD: The extension '.$tld' is statistically associated with malware and spam.")
                riskScore += 20
            }
        }

        // Final score calculation
        var finalRiskScore = if (warnings.isNotEmpty()) {
            maxOf(riskScore, mlScore)
        } else {
            minOf(mlScore, 20) // cap at 20 (Safe) if no warnings triggered
        }

        finalRiskScore = minOf(maxOf(finalRiskScore, 0), 100)
        val safetyScore = 100 - finalRiskScore

        val rating = when {
            finalRiskScore >= 70 -> "DANGEROUS"
            finalRiskScore >= 35 -> "SUSPICIOUS"
            else -> "SAFE"
        }

        return Result(
            url = rawUrl,
            domain = hostname,
            isSafe = rating == "SAFE",
            score = safetyScore,
            rating = rating,
            warnings = warnings
        )
    }
}
